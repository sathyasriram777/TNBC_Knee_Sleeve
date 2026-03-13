"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BLE_IMU_CHAR_UUID,
  BLE_IMU_DEVICE_NAME,
  BLE_IMU_SERVICE_UUID,
  type BleImuFilterMode,
  median,
  movingAvg,
  parseBleImuCsv,
} from "@/lib/ble-imu";
import { type ImuChartPoint, imuAnglesFromAyAz } from "@/lib/chart-data";

// Web Bluetooth API (minimal types; not in default DOM lib)
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

export function useBleImu() {
  const [status, setStatus] = useState<BleImuStatus>(() =>
    isBluetoothSupported() ? "idle" : "unsupported"
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [points, setPoints] = useState<ImuChartPoint[]>([]);
  const [filterMode, setFilterMode] = useState<BleImuFilterMode>("raw");
  const [windowSize, setWindowSize] = useState(DEFAULT_WINDOW);

  const bufsRef = useRef<{ ax: number[]; ay: number[]; az: number[] }>({
    ax: [],
    ay: [],
    az: [],
  });
  const deviceRef = useRef<BleDevice | null>(null);
  const charRef = useRef<BleCharacteristic | null>(null);
  const filterModeRef = useRef(filterMode);
  const windowSizeRef = useRef(windowSize);
  filterModeRef.current = filterMode;
  windowSizeRef.current = windowSize;

  const pendingRef = useRef<ImuChartPoint[]>([]);
  const rafIdRef = useRef<number | null>(null);

  const flushPending = useCallback(() => {
    rafIdRef.current = null;
    const batch = pendingRef.current;
    if (batch.length === 0) return;
    pendingRef.current = [];
    setPoints((prev) => {
      const next = [...prev, ...batch];
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    });
  }, []);

  const onNotify = useCallback((event: Event) => {
    const char = event.target as BleCharacteristic;
    const value = char.value;
    if (!value) return;
    const raw = new TextDecoder().decode(value);
    const parsed = parseBleImuCsv(raw);
    if (!parsed) return;

    const mode = filterModeRef.current;
    const win = windowSizeRef.current;
    const bufs = bufsRef.current;

    const push = (key: "ax" | "ay" | "az", val: number) => {
      bufs[key].push(val);
      while (bufs[key].length > win) bufs[key].shift();
    };

    push("ax", parsed.ax);
    push("ay", parsed.ay);
    push("az", parsed.az);

    let ax = parsed.ax;
    let ay = parsed.ay;
    let az = parsed.az;
    if (mode === "moving") {
      ax = movingAvg(bufs.ax);
      ay = movingAvg(bufs.ay);
      az = movingAvg(bufs.az);
    } else if (mode === "median") {
      ax = median(bufs.ax);
      ay = median(bufs.ay);
      az = median(bufs.az);
    }

    const time = new Date().toISOString();
    const { ang1, ang2 } = imuAnglesFromAyAz(ay, az);
    pendingRef.current.push({ time, ax, ay, az, ang1, ang2 });

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(flushPending);
    }
  }, [flushPending]);

  const connect = useCallback(async () => {
    if (!isBluetoothSupported()) {
      setStatus("unsupported");
      setStatusMessage("Web Bluetooth is not supported in this browser.");
      return;
    }
    setStatus("scanning");
    setStatusMessage("Scanning...");

    try {
      const nav = navigator as Navigator & { bluetooth?: { requestDevice(opts: object): Promise<BleDevice> } };
      // Show all nearby BLE devices; no name/service filter. User picks the IMU device.
      const device = await nav.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: [BLE_IMU_SERVICE_UUID],
      });

      deviceRef.current = device;

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("disconnected");
        setStatusMessage("Device disconnected");
        deviceRef.current = null;
        charRef.current = null;
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(BLE_IMU_SERVICE_UUID);
      const char = await service.getCharacteristic(BLE_IMU_CHAR_UUID);
      charRef.current = char;

      await char.startNotifications();
      char.addEventListener("characteristicvaluechanged", onNotify);

      setStatus("connected");
      setStatusMessage(`Connected · ${device.name ?? "Nano33-IMU"}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setStatus("error");
      setStatusMessage(`Error: ${message}`);
      deviceRef.current = null;
      charRef.current = null;
    }
  }, [onNotify]);

  const disconnect = useCallback(() => {
    const device = deviceRef.current;
    const char = charRef.current;
    if (char) {
      try {
        char.removeEventListener("characteristicvaluechanged", onNotify);
        char.stopNotifications().catch(() => {});
      } catch {
        // ignore
      }
      charRef.current = null;
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    deviceRef.current = null;
    setStatus("idle");
    setStatusMessage("");
  }, [onNotify]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Trim buffers when window size decreases
  useEffect(() => {
    for (const key of ["ax", "ay", "az"] as const) {
      const buf = bufsRef.current[key];
      while (buf.length > windowSize) buf.shift();
    }
  }, [windowSize]);

  const isConnected = status === "connected";

  return {
    connect,
    disconnect,
    isConnected,
    status,
    statusMessage,
    points,
    clearPoints: useCallback(() => setPoints([]), []),
    filterMode,
    setFilterMode,
    windowSize,
    setWindowSize,
    supported: isBluetoothSupported(),
  };
}
