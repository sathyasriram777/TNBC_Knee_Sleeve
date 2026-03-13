"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BLE_IMU_CHAR_UUID,
  BLE_IMU_SERVICE_UUID,
  type BleImuFilterMode,
  median,
  movingAvg,
  parseBleImuCsv,
} from "@/lib/ble-imu";
import { type ImuChartPoint, imuAnglesFromAyAz } from "@/lib/chart-data";

interface BleDevice {
  gatt?: { connect(): Promise<BleServer>; disconnect(): void; connected: boolean };
  name?: string;
  addEventListener(type: string, fn: () => void): void;
}
interface BleServer {
  getPrimaryService(uuid: string): Promise<{ getCharacteristic(uuid: string): Promise<BleCharacteristic> }>;
}
interface BleCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<unknown>;
  stopNotifications(): Promise<unknown>;
}

const MAX_POINTS = 500;
const DEFAULT_WINDOW = 9;
const CALIBRATION_DURATION_MS = 3000;

function isBluetoothSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "bluetooth" in navigator;
}

export type BleImuStatus =
  | "unsupported"
  | "idle"
  | "scanning"
  | "connected"
  | "disconnected"
  | "error";

export type SensorSlot = "A" | "B";

export type Assignment = { right: SensorSlot; left: SensorSlot };

export type CalibrationPhase = "idle" | "recording" | "done";

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
}

export function useDualBleImu() {
  const [statusA, setStatusA] = useState<BleImuStatus>(() =>
    isBluetoothSupported() ? "idle" : "unsupported"
  );
  const [statusB, setStatusB] = useState<BleImuStatus>(() =>
    isBluetoothSupported() ? "idle" : "unsupported"
  );
  const [statusMessageA, setStatusMessageA] = useState("");
  const [statusMessageB, setStatusMessageB] = useState("");
  const [pointsA, setPointsA] = useState<ImuChartPoint[]>([]);
  const [pointsB, setPointsB] = useState<ImuChartPoint[]>([]);
  const [filterModeA, setFilterModeA] = useState<BleImuFilterMode>("raw");
  const [filterModeB, setFilterModeB] = useState<BleImuFilterMode>("raw");
  const [windowSizeA, setWindowSizeA] = useState(DEFAULT_WINDOW);
  const [windowSizeB, setWindowSizeB] = useState(DEFAULT_WINDOW);

  const [calibrationPhase, setCalibrationPhase] = useState<CalibrationPhase>("idle");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const calibrationRecordingRef = useRef(false);

  const refsA = useRef({
    bufs: { ax: [] as number[], ay: [] as number[], az: [] as number[] },
    device: null as BleDevice | null,
    char: null as BleCharacteristic | null,
    filterMode: "raw" as BleImuFilterMode,
    windowSize: DEFAULT_WINDOW,
    pending: [] as ImuChartPoint[],
    rafId: null as number | null,
    calibrationBuffer: [] as number[],
  }).current;
  const refsB = useRef({
    bufs: { ax: [] as number[], ay: [] as number[], az: [] as number[] },
    device: null as BleDevice | null,
    char: null as BleCharacteristic | null,
    filterMode: "raw" as BleImuFilterMode,
    windowSize: DEFAULT_WINDOW,
    pending: [] as ImuChartPoint[],
    rafId: null as number | null,
    calibrationBuffer: [] as number[],
  }).current;

  refsA.filterMode = filterModeA;
  refsA.windowSize = windowSizeA;
  refsB.filterMode = filterModeB;
  refsB.windowSize = windowSizeB;

  const flushPending = useCallback(
    (refs: typeof refsA, setPoints: React.Dispatch<React.SetStateAction<ImuChartPoint[]>>) => {
      refs.rafId = null;
      const batch = refs.pending;
      if (batch.length === 0) return;
      refs.pending = [];
      setPoints((prev) => {
        const next = [...prev, ...batch];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });
    },
    []
  );

  const makeOnNotify = useCallback(
    (
      refs: typeof refsA,
      setPoints: React.Dispatch<React.SetStateAction<ImuChartPoint[]>>
    ) => {
      return (event: Event) => {
        const char = event.target as BleCharacteristic;
        const value = char.value;
        if (!value) return;
        const raw = new TextDecoder().decode(value);
        const parsed = parseBleImuCsv(raw);
        if (!parsed) return;

        const { bufs, filterMode, windowSize } = refs;

        const push = (key: "ax" | "ay" | "az", val: number) => {
          bufs[key].push(val);
          while (bufs[key].length > windowSize) bufs[key].shift();
        };

        push("ax", parsed.ax);
        push("ay", parsed.ay);
        push("az", parsed.az);

        let ax = parsed.ax;
        let ay = parsed.ay;
        let az = parsed.az;
        if (filterMode === "moving") {
          ax = movingAvg(bufs.ax);
          ay = movingAvg(bufs.ay);
          az = movingAvg(bufs.az);
        } else if (filterMode === "median") {
          ax = median(bufs.ax);
          ay = median(bufs.ay);
          az = median(bufs.az);
        }

        const time = new Date().toISOString();
        const { ang1, ang2 } = imuAnglesFromAyAz(ay, az);
        refs.pending.push({ time, ax, ay, az, ang1, ang2 });

        if (calibrationRecordingRef.current) {
          const mag = Math.sqrt(ax * ax + ay * ay + az * az);
          refs.calibrationBuffer.push(mag);
        }

        if (refs.rafId === null) {
          refs.rafId = requestAnimationFrame(() => flushPending(refs, setPoints));
        }
      };
    },
    [flushPending]
  );

  const onNotifyA = useCallback(makeOnNotify(refsA, setPointsA), [makeOnNotify]);
  const onNotifyB = useCallback(makeOnNotify(refsB, setPointsB), [makeOnNotify]);

  const connect = useCallback(
    (slot: SensorSlot) => {
      const refs = slot === "A" ? refsA : refsB;
      const setStatus = slot === "A" ? setStatusA : setStatusB;
      const setStatusMessage = slot === "A" ? setStatusMessageA : setStatusMessageB;
      const onNotify = slot === "A" ? onNotifyA : onNotifyB;

      return async () => {
        if (!isBluetoothSupported()) {
          setStatus("unsupported");
          setStatusMessage("Web Bluetooth is not supported.");
          return;
        }
        setStatus("scanning");
        setStatusMessage("Scanning...");

        try {
          const nav = navigator as Navigator & {
            bluetooth?: { requestDevice(opts: object): Promise<BleDevice> };
          };
          const device = await nav.bluetooth!.requestDevice({
            acceptAllDevices: true,
            optionalServices: [BLE_IMU_SERVICE_UUID],
          });

          refs.device = device;

          device.addEventListener("gattserverdisconnected", () => {
            setStatus("disconnected");
            setStatusMessage("Device disconnected");
            refs.device = null;
            refs.char = null;
          });

          const server = await device.gatt!.connect();
          const service = await server.getPrimaryService(BLE_IMU_SERVICE_UUID);
          const char = await service.getCharacteristic(BLE_IMU_CHAR_UUID);
          refs.char = char;

          await char.startNotifications();
          char.addEventListener("characteristicvaluechanged", onNotify);

          setStatus("connected");
          setStatusMessage(`Connected · ${device.name ?? "IMU"}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connection failed";
          setStatus("error");
          setStatusMessage(`Error: ${message}`);
          refs.device = null;
          refs.char = null;
        }
      };
    },
    [onNotifyA, onNotifyB, refsA, refsB]
  );

  const disconnect = useCallback((slot: SensorSlot) => {
    const refs = slot === "A" ? refsA : refsB;
    const setStatus = slot === "A" ? setStatusA : setStatusB;
    const setStatusMessage = slot === "A" ? setStatusMessageA : setStatusMessageB;
    const onNotify = slot === "A" ? onNotifyA : onNotifyB;

    return () => {
      const char = refs.char;
      if (char) {
        try {
          char.removeEventListener("characteristicvaluechanged", onNotify);
          char.stopNotifications().catch(() => {});
        } catch {
          // ignore
        }
        refs.char = null;
      }
      if (refs.device?.gatt?.connected) {
        refs.device.gatt.disconnect();
      }
      refs.device = null;
      setStatus("idle");
      setStatusMessage("");
    };
  }, [onNotifyA, onNotifyB, refsA, refsB]);

  const connectA = useCallback(() => connect("A")(), [connect]);
  const connectB = useCallback(() => connect("B")(), [connect]);
  const disconnectA = useCallback(() => disconnect("A")(), [disconnect]);
  const disconnectB = useCallback(() => disconnect("B")(), [disconnect]);
  const clearPointsA = useCallback(() => setPointsA([]), []);
  const clearPointsB = useCallback(() => setPointsB([]), []);

  const startCalibration = useCallback(() => {
    if (statusA !== "connected" || statusB !== "connected") return;
    setCalibrationPhase("recording");
    setAssignment(null);
    refsA.calibrationBuffer = [];
    refsB.calibrationBuffer = [];
    calibrationRecordingRef.current = true;

    const timer = setTimeout(() => {
      calibrationRecordingRef.current = false;
      const varA = variance(refsA.calibrationBuffer);
      const varB = variance(refsB.calibrationBuffer);
      const right: SensorSlot = varA >= varB ? "A" : "B";
      const left: SensorSlot = right === "A" ? "B" : "A";
      setAssignment({ right, left });
      setCalibrationPhase("done");
    }, CALIBRATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [statusA, statusB, refsA, refsB]);

  useEffect(() => {
    return () => {
      disconnectA();
      disconnectB();
    };
  }, [disconnectA, disconnectB]);

  const bothConnected = statusA === "connected" && statusB === "connected";

  const rightPoints = assignment
    ? assignment.right === "A"
      ? pointsA
      : pointsB
    : [];
  const leftPoints = assignment
    ? assignment.left === "A"
      ? pointsA
      : pointsB
    : [];

  const rightFilterMode = assignment ? (assignment.right === "A" ? filterModeA : filterModeB) : "raw";
  const leftFilterMode = assignment ? (assignment.left === "A" ? filterModeA : filterModeB) : "raw";
  const setRightFilterMode = useCallback(
    (m: BleImuFilterMode) => {
      if (assignment) (assignment.right === "A" ? setFilterModeA : setFilterModeB)(m);
    },
    [assignment, setFilterModeA, setFilterModeB]
  );
  const setLeftFilterMode = useCallback(
    (m: BleImuFilterMode) => {
      if (assignment) (assignment.left === "A" ? setFilterModeA : setFilterModeB)(m);
    },
    [assignment, setFilterModeA, setFilterModeB]
  );
  const rightWindowSize = assignment ? (assignment.right === "A" ? windowSizeA : windowSizeB) : DEFAULT_WINDOW;
  const leftWindowSize = assignment ? (assignment.left === "A" ? windowSizeA : windowSizeB) : DEFAULT_WINDOW;
  const setRightWindowSize = useCallback(
    (n: number) => {
      if (assignment) (assignment.right === "A" ? setWindowSizeA : setWindowSizeB)(n);
    },
    [assignment, setWindowSizeA, setWindowSizeB]
  );
  const setLeftWindowSize = useCallback(
    (n: number) => {
      if (assignment) (assignment.left === "A" ? setWindowSizeA : setWindowSizeB)(n);
    },
    [assignment, setWindowSizeA, setWindowSizeB]
  );

  return {
    supported: isBluetoothSupported(),
    sensorA: {
      status: statusA,
      statusMessage: statusMessageA,
      points: pointsA,
      connect: connectA,
      disconnect: disconnectA,
      clearPoints: clearPointsA,
      isConnected: statusA === "connected",
      filterMode: filterModeA,
      setFilterMode: setFilterModeA,
      windowSize: windowSizeA,
      setWindowSize: setWindowSizeA,
    },
    sensorB: {
      status: statusB,
      statusMessage: statusMessageB,
      points: pointsB,
      connect: connectB,
      disconnect: disconnectB,
      clearPoints: clearPointsB,
      isConnected: statusB === "connected",
      filterMode: filterModeB,
      setFilterMode: setFilterModeB,
      windowSize: windowSizeB,
      setWindowSize: setWindowSizeB,
    },
    bothConnected,
    calibrationPhase,
    assignment,
    startCalibration,
    right: {
      points: rightPoints,
      filterMode: rightFilterMode,
      setFilterMode: setRightFilterMode,
      windowSize: rightWindowSize,
      setWindowSize: setRightWindowSize,
    },
    left: {
      points: leftPoints,
      filterMode: leftFilterMode,
      setFilterMode: setLeftFilterMode,
      windowSize: leftWindowSize,
      setWindowSize: setLeftWindowSize,
    },
  };
}
