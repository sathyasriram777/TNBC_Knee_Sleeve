"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImuChartPoint } from "@/lib/chart-data";
import {
  analyzeRomRecording,
  compareRom,
  getBaselineAngle,
  type RomComparison,
  type RomResult,
} from "@/lib/rom-test";
import {
  loadHistory,
  saveReading,
  clearHistory,
  type TestReading,
} from "@/lib/test-history";
import { cn } from "@/lib/utils";

const RECORD_DURATION_MS = 5000;
const RECORD_SECONDS = 5;
const HISTORY_KEY = "rom-history" as const;

type Phase =
  | "idle"
  | "ready_left"
  | "recording_left"
  | "ready_right"
  | "recording_right"
  | "done";

type RomTestCardProps = {
  leftPoints: ImuChartPoint[];
  rightPoints: ImuChartPoint[];
  calibrated: boolean;
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function HistoryChart({ readings }: { readings: TestReading[] }) {
  const data = readings.map((r) => ({
    label: formatTimestamp(r.timestamp),
    percent: r.percent,
  }));

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-background min-h-[220px]">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={[0, "auto"]}
              label={{ value: "%", position: "insideTopLeft", offset: -4, fontSize: 11 }}
            />
            <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Deficit"]} />
            <Line
              type="monotone"
              dataKey="percent"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
          No saved readings yet.
        </div>
      )}
    </div>
  );
}

export function RomTestCard({ leftPoints, rightPoints, calibrated }: RomTestCardProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(RECORD_SECONDS);
  const [leftResult, setLeftResult] = useState<RomResult | null>(null);
  const [, setRightResult] = useState<RomResult | null>(null);
  const [comparison, setComparison] = useState<RomComparison | null>(null);
  const [history, setHistory] = useState<TestReading[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHistory(loadHistory(HISTORY_KEY));
  }, []);

  const recordStartTimeRef = useRef<string>("");
  const baselineRef = useRef<number>(0);
  const leftPtsRef = useRef(leftPoints);
  const rightPtsRef = useRef(rightPoints);
  const leftResultRef = useRef(leftResult);
  leftPtsRef.current = leftPoints;
  rightPtsRef.current = rightPoints;
  leftResultRef.current = leftResult;

  const startRecording = useCallback((side: "left" | "right") => {
    const pts = side === "left" ? leftPtsRef.current : rightPtsRef.current;
    baselineRef.current = getBaselineAngle(pts);
    recordStartTimeRef.current = new Date().toISOString();
    setCountdown(RECORD_SECONDS);
    setPhase(side === "left" ? "recording_left" : "recording_right");
  }, []);

  useEffect(() => {
    if (phase !== "recording_left" && phase !== "recording_right") return;

    const countdownId = window.setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timerId = window.setTimeout(() => {
      const side = phase === "recording_left" ? "left" : "right";
      const pts = side === "left" ? leftPtsRef.current : rightPtsRef.current;
      const startTime = recordStartTimeRef.current;
      const captured = pts.filter((p) => p.time >= startTime);
      const result = analyzeRomRecording(captured, baselineRef.current);

      if (side === "left") {
        setLeftResult(result);
        setPhase("ready_right");
      } else {
        setRightResult(result);
        const comp = compareRom(leftResultRef.current!, result);
        setComparison(comp);
        setPhase("done");
      }
    }, RECORD_DURATION_MS);

    return () => {
      window.clearInterval(countdownId);
      window.clearTimeout(timerId);
    };
  }, [phase]);

  const reset = useCallback(() => {
    setPhase("idle");
    setLeftResult(null);
    setRightResult(null);
    setComparison(null);
    setCountdown(RECORD_SECONDS);
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!comparison) return;
    const updated = saveReading(HISTORY_KEY, comparison.deficitPercent);
    setHistory(updated);
    setSaved(true);
  }, [comparison]);

  const handleClearHistory = useCallback(() => {
    clearHistory(HISTORY_KEY);
    setHistory([]);
  }, []);

  if (!calibrated) return null;

  return (
    <Card className="border-0 bg-white">
      <CardHeader className="px-6 pt-6 pb-3">
        <CardTitle className="text-foreground text-lg">Range of motion comparison</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        {phase === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The patient lifts each leg as high as possible and holds for 5 seconds.
              The app records the peak lift angle and compares both sides.
            </p>
            <Button type="button" onClick={() => setPhase("ready_left")}>
              Start ROM test
            </Button>
          </div>
        )}

        {phase === "ready_left" && (
          <div className="space-y-3">
            <p className="font-medium text-foreground">Left leg</p>
            <p className="text-sm text-muted-foreground">
              Ask the patient to lift their <strong>left</strong> leg as high as they can and hold.
              Press Start when the patient is ready.
            </p>
            <Button type="button" onClick={() => startRecording("left")}>
              Start
            </Button>
          </div>
        )}

        {phase === "recording_left" && (
          <div className="space-y-3">
            <p className="font-medium text-foreground">Recording left leg</p>
            <div className="flex items-center justify-center rounded-lg bg-muted py-6">
              <span className="text-4xl font-bold tabular-nums text-foreground">{countdown}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">Patient holds leg up...</p>
          </div>
        )}

        {phase === "ready_right" && (
          <div className="space-y-3">
            {leftResult && (
              <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                Left leg recorded — peak angle: <span className="font-medium text-foreground">{leftResult.peakAngle.toFixed(1)}°</span>
              </div>
            )}
            <p className="font-medium text-foreground">Right leg</p>
            <p className="text-sm text-muted-foreground">
              Now ask the patient to lift their <strong>right</strong> leg as high as they can and hold.
              Press Start when ready.
            </p>
            <div className="flex gap-3">
              <Button type="button" onClick={() => startRecording("right")}>
                Start
              </Button>
              <Button type="button" variant="outline" onClick={() => { setLeftResult(null); setPhase("ready_left"); }}>
                Redo left leg
              </Button>
            </div>
          </div>
        )}

        {phase === "recording_right" && (
          <div className="space-y-3">
            <p className="font-medium text-foreground">Recording right leg</p>
            <div className="flex items-center justify-center rounded-lg bg-muted py-6">
              <span className="text-4xl font-bold tabular-nums text-foreground">{countdown}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">Patient holds leg up...</p>
          </div>
        )}

        {phase === "done" && comparison && (
          <div className="space-y-4">
            <p className="font-medium text-foreground">Results</p>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Left leg</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{comparison.left.peakAngle.toFixed(1)}°</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Right leg</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{comparison.right.peakAngle.toFixed(1)}°</p>
              </div>
            </div>

            <div className={cn(
              "flex flex-col items-center justify-center rounded-lg py-4 gap-1",
              comparison.deficitSide === "balanced"
                ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
            )}>
              <span className="text-lg font-bold">
                {comparison.deficitSide === "balanced"
                  ? "Balanced range of motion"
                  : `${comparison.deficitSide === "left" ? "Left" : "Right"} leg has ${comparison.deficitPercent}% less range`}
              </span>
              <span className="text-sm font-normal opacity-80">
                {comparison.angleDifference.toFixed(1)}° difference
              </span>
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={handleSave} disabled={saved}>
                {saved ? "Saved" : "Save & Plot"}
              </Button>
              <Button type="button" variant="outline" onClick={reset}>
                Retest
              </Button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">ROM deficit over time</p>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleClearHistory}>
                Clear history
              </Button>
            </div>
            <HistoryChart readings={history} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
