"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ImuDataCard } from "@/components/imu-data-card";
import type { DualBleImuReturn } from "@/hooks/use-dual-ble-imu";
import type { BleImuFilterMode } from "@/lib/ble-imu";
import type { ImuChartPoint } from "@/lib/chart-data";
import { computeAgitationComparison } from "@/lib/stride-analysis";
import { cn } from "@/lib/utils";

const DISPLAY_WINDOW = 120;

const FILTER_MODES: { value: BleImuFilterMode; label: string }[] = [
  { value: "raw", label: "Raw" },
  { value: "moving", label: "Moving avg" },
  { value: "median", label: "Median" },
];

const CALIBRATION_SECONDS = 3;

type SideDisplayProps = {
  side: "left" | "right";
  points: ImuChartPoint[];
  filterMode: BleImuFilterMode;
  setFilterMode: (m: BleImuFilterMode) => void;
  windowSize: number;
  setWindowSize: (n: number) => void;
};

type SensorControlProps = {
  label: string;
  status: DualBleImuReturn["sensorA"]["status"];
  statusMessage: string;
  isConnected: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
};

function getAng2Stats(points: ImuChartPoint[]) {
  const ang2Values = points
    .map((point) => point.ang2)
    .filter((value): value is number => value != null);
  const current = ang2Values[ang2Values.length - 1] ?? null;

  return {
    current,
    min: ang2Values.length ? Math.min(...ang2Values) : null,
    max: ang2Values.length ? Math.max(...ang2Values) : null,
  };
}

function formatAngle(value: number | null) {
  return value == null ? "--" : `${value.toFixed(1)}°`;
}

function buildCombinedAngleData(
  leftPoints: ImuChartPoint[],
  rightPoints: ImuChartPoint[],
) {
  const length = Math.max(leftPoints.length, rightPoints.length);
  return Array.from({ length }, (_, i) => ({
    idx: i,
    leftAng2: leftPoints[i]?.ang2 ?? null,
    rightAng2: rightPoints[i]?.ang2 ?? null,
  }));
}

function SensorControl({
  label,
  status,
  statusMessage,
  isConnected,
  onConnect,
  onDisconnect,
}: SensorControlProps) {
  const tone =
    status === "error"
      ? "text-destructive"
      : isConnected
        ? "text-green-600 dark:text-green-400"
        : "text-muted-foreground";

  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-2 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-row items-center gap-2">
        <Button
          type="button"
          onClick={onConnect}
          disabled={status === "scanning" || isConnected}
          className="shrink-0"
        >
          {status === "scanning" ? `Connecting ${label}...` : `Connect ${label}`}
        </Button>
        {isConnected && (
          <Button type="button" variant="outline" onClick={onDisconnect}>
            Disconnect
          </Button>
        )}
      </div>
      <p className={cn("text-sm", tone)}>
        {isConnected
          ? statusMessage
          : status === "scanning"
            ? "Bluetooth picker open. Choose the device for this leg."
            : status === "error"
              ? statusMessage
              : "Not connected"}
      </p>
    </div>
  );
}

function SideDisplay({
  side,
  points,
  filterMode,
  setFilterMode,
  windowSize,
  setWindowSize,
}: SideDisplayProps) {
  const label = side === "left" ? "Left" : "Right";
  const ang2 = getAng2Stats(points);

  return (
    <Card className="border-0 bg-white flex-1 min-w-0 flex flex-col">
      <CardHeader className="px-6 pt-6 pb-3">
        <CardTitle className="text-foreground text-lg">{label} leg</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 flex flex-col flex-1 min-h-0 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            {FILTER_MODES.map(({ value, label: l }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterMode(value)}
                className={cn(
                  "rounded px-2 py-0.5 text-xs",
                  filterMode === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div
            className={cn(
              "flex items-center gap-1",
              filterMode === "raw" && "opacity-50 pointer-events-none"
            )}
          >
            <Label htmlFor={`${side}-window`} className="text-xs text-muted-foreground">
              Window:
            </Label>
            <input
              id={`${side}-window`}
              type="range"
              min={3}
              max={21}
              step={2}
              value={windowSize}
              onChange={(e) => setWindowSize(parseInt(e.target.value, 10))}
              className="w-20"
            />
            <span className="text-muted-foreground text-xs w-5">{windowSize}</span>
          </div>
        </div>
        <div className="min-h-[260px] flex-1">
          <ImuDataCard data={points} live />
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">ang2</th>
                <th className="px-4 py-2 font-medium">Current</th>
                <th className="px-4 py-2 font-medium">Min</th>
                <th className="px-4 py-2 font-medium">Max</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-4 py-2 font-medium text-foreground">{label}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatAngle(ang2.current)}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatAngle(ang2.min)}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatAngle(ang2.max)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

type AgitationPanelProps = {
  leftPoints: ImuChartPoint[];
  rightPoints: ImuChartPoint[];
  isClinician: boolean;
};

function AgitationPanel({ leftPoints, rightPoints, isClinician }: AgitationPanelProps) {
  const result = useMemo(
    () => computeAgitationComparison(leftPoints, rightPoints),
    [leftPoints, rightPoints],
  );

  return (
    <Card className="border-0 bg-white">
      <CardHeader className="px-6 pt-6 pb-3">
        <CardTitle className="text-foreground text-lg">Compensation check</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        {result ? (
          <div className="space-y-4 rounded-lg border border-border bg-background p-5">
            <div className={cn(
              "flex items-center justify-center rounded-lg py-6 text-2xl font-bold",
              result.compensating
                ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
            )}>
              {result.compensating ? "Compensating" : "Not Compensating"}
            </div>

            {isClinician && (
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Left agitation</p>
                  <p className="font-semibold tabular-nums text-foreground">{result.leftAgitation.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Right agitation</p>
                  <p className="font-semibold tabular-nums text-foreground">{result.rightAgitation.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Difference</p>
                  <p className="font-semibold tabular-nums text-foreground">{(result.difference * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Collecting data. Move around so we can measure agitation.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type DualLiveImuCardProps = DualBleImuReturn & {
  isClinician: boolean;
};

export function DualLiveImuCard(props: DualLiveImuCardProps) {
  const {
    supported,
    sensorA,
    sensorB,
    bothConnected,
    calibrationPhase,
    assignment,
    startCalibration,
    right,
    left,
    isClinician,
  } = props;
  const [secondsRemaining, setSecondsRemaining] = useState(CALIBRATION_SECONDS);
  const [paused, setPaused] = useState(false);
  const [snapshot, setSnapshot] = useState<{ left: ImuChartPoint[]; right: ImuChartPoint[] } | null>(null);

  const handlePauseToggle = useCallback(() => {
    setPaused((prev) => {
      if (!prev) {
        setSnapshot({ left: left.points, right: right.points });
      } else {
        setSnapshot(null);
      }
      return !prev;
    });
  }, [left.points, right.points]);

  const displayLeft = paused && snapshot ? snapshot.left : left.points;
  const displayRight = paused && snapshot ? snapshot.right : right.points;

  const combinedAngleData = useMemo(
    () => buildCombinedAngleData(displayLeft, displayRight).slice(-DISPLAY_WINDOW),
    [displayLeft, displayRight],
  );

  useEffect(() => {
    if (calibrationPhase !== "recording") {
      setSecondsRemaining(CALIBRATION_SECONDS);
      return;
    }

    setSecondsRemaining(CALIBRATION_SECONDS);
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [calibrationPhase]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-row flex-wrap gap-4">
        <SensorControl
          label="leg 1"
          status={sensorA.status}
          statusMessage={sensorA.statusMessage}
          isConnected={sensorA.isConnected}
          onConnect={sensorA.connect}
          onDisconnect={sensorA.disconnect}
        />
        <SensorControl
          label="leg 2"
          status={sensorB.status}
          statusMessage={sensorB.statusMessage}
          isConnected={sensorB.isConnected}
          onConnect={sensorB.connect}
          onDisconnect={sensorB.disconnect}
        />
      </div>

      {!supported ? (
        <Card className="border-0 bg-white">
          <CardContent className="px-6 py-5">
            <p className="text-sm text-muted-foreground">
              Web Bluetooth is not supported in this browser. Use Chrome or Edge over HTTPS or localhost.
            </p>
          </CardContent>
        </Card>
      ) : calibrationPhase !== "done" || !assignment ? (
        <Card className="border-0 bg-white">
          <CardContent className="px-6 py-5">
            {!bothConnected ? (
              <div className="space-y-1">
                <p className="font-medium text-foreground">Waiting for both sensors</p>
                <p className="text-sm text-muted-foreground">
                  Connect both legs above. Once both are connected, the app will calibrate which sensor is right and which is left.
                </p>
              </div>
            ) : calibrationPhase === "recording" ? (
              <div className="space-y-1">
                <p className="font-medium text-foreground">Detecting right leg...</p>
                <p className="text-sm text-muted-foreground">
                  Lift your right foot now and hold briefly. Finishing in {secondsRemaining}s.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Calibration required</p>
                  <p className="text-sm text-muted-foreground">
                    Lift your right foot so the app can identify which connected sensor belongs to the right leg.
                  </p>
                </div>
                <Button type="button" onClick={startCalibration} className="sm:shrink-0">
                  Detect right leg
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 bg-white">
          <CardContent className="px-6 py-4">
            <p className="text-sm text-green-600 dark:text-green-400">
              Ready. Right leg is connected to leg {assignment.right === "A" ? "1" : "2"}, left leg is connected to leg {assignment.left === "A" ? "1" : "2"}.
            </p>
          </CardContent>
        </Card>
      )}

      {assignment && calibrationPhase === "done" && (
        <>
          {isClinician && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SideDisplay
                  side="left"
                  points={left.points}
                  filterMode={left.filterMode}
                  setFilterMode={left.setFilterMode}
                  windowSize={left.windowSize}
                  setWindowSize={left.setWindowSize}
                />
                <SideDisplay
                  side="right"
                  points={right.points}
                  filterMode={right.filterMode}
                  setFilterMode={right.setFilterMode}
                  windowSize={right.windowSize}
                  setWindowSize={right.setWindowSize}
                />
              </div>

              <Card className="border-0 bg-white">
                <CardHeader className="px-6 pt-6 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-foreground text-lg">ang2 comparison</CardTitle>
                  <Button
                    type="button"
                    variant={paused ? "default" : "outline"}
                    size="sm"
                    onClick={handlePauseToggle}
                  >
                    {paused ? "Resume" : "Pause"}
                  </Button>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="w-full overflow-hidden rounded-lg border border-border bg-background min-h-[280px]">
                    {combinedAngleData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart
                          data={combinedAngleData}
                          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="idx"
                            type="number"
                            tick={{ fontSize: 10 }}
                            domain={["dataMin", "dataMax"]}
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            labelFormatter={(v) => `Sample ${v}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="leftAng2"
                            name="Left ang2"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="rightAng2"
                            name="Right ang2"
                            stroke="#82ca9d"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                        No angle data yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <AgitationPanel
            leftPoints={displayLeft}
            rightPoints={displayRight}
            isClinician={isClinician}
          />
        </>
      )}
    </div>
  );
}
