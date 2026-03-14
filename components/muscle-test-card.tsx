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
  analyzeHoldRecording,
  compareMuscleTests,
  type MuscleComparison,
  type MuscleTestResult,
} from "@/lib/muscle-test";
import { getBaselineAngle } from "@/lib/rom-test";
import {
  loadHistory,
  saveReading,
  clearHistory,
  type TestHistoryKey,
  type TestReading,
} from "@/lib/test-history";
import { cn } from "@/lib/utils";

const RECORD_DURATION_MS = 5000;
const RECORD_SECONDS = 5;

type Phase =
  | "idle"
  | "ready_left"
  | "recording_left"
  | "ready_right"
  | "recording_right"
  | "done";

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
    <div className="w-full overflow-hidden rounded-lg border border-border bg-background min-h-[200px]">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9 }}
              angle={-30}
              textAnchor="end"
              height={46}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={[0, "auto"]}
              label={{ value: "%", position: "insideTopLeft", offset: -4, fontSize: 11 }}
            />
            <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Weakness"]} />
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
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
          No saved readings yet.
        </div>
      )}
    </div>
  );
}

type SingleTestProps = {
  label: string;
  historyKey: TestHistoryKey;
  leftPoints: ImuChartPoint[];
  rightPoints: ImuChartPoint[];
};

function SingleMuscleTest({ label, historyKey, leftPoints, rightPoints }: SingleTestProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(RECORD_SECONDS);
  const [leftResult, setLeftResult] = useState<MuscleTestResult | null>(null);
  const [, setRightResult] = useState<MuscleTestResult | null>(null);
  const [comparison, setComparison] = useState<MuscleComparison | null>(null);
  const [history, setHistory] = useState<TestReading[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHistory(loadHistory(historyKey));
  }, [historyKey]);

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
      const result = analyzeHoldRecording(captured, baselineRef.current);

      if (side === "left") {
        setLeftResult(result);
        setPhase("ready_right");
      } else {
        setRightResult(result);
        const comp = compareMuscleTests(leftResultRef.current!, result);
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
    const updated = saveReading(historyKey, comparison.weaknessPercent);
    setHistory(updated);
    setSaved(true);
  }, [comparison, historyKey]);

  const handleClearHistory = useCallback(() => {
    clearHistory(historyKey);
    setHistory([]);
  }, [historyKey]);

  return (
    <div className="space-y-4">
      <p className="font-medium text-foreground text-base">{label}</p>

      {phase === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Attach the resistance band. Press Start to record the left leg first.
          </p>
          <Button type="button" size="sm" onClick={() => setPhase("ready_left")}>
            Start {label.toLowerCase()} test
          </Button>
        </div>
      )}

      {phase === "ready_left" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Lift the <strong>left</strong> leg as high as possible against the band and hold. Press Start when ready.
          </p>
          <Button type="button" size="sm" onClick={() => startRecording("left")}>
            Start
          </Button>
        </div>
      )}

      {phase === "recording_left" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Recording left leg...</p>
          <div className="flex items-center justify-center rounded-lg bg-muted py-4">
            <span className="text-3xl font-bold tabular-nums text-foreground">{countdown}</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPhase("ready_left")}>
            Restart left
          </Button>
        </div>
      )}

      {phase === "ready_right" && (
        <div className="space-y-3">
          {leftResult && (
            <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
              Left recorded — peak accel: <span className="font-medium text-foreground">{leftResult.peakAccel.toFixed(3)}</span>,
              peak angle: <span className="font-medium text-foreground">{leftResult.peakAngle.toFixed(1)}°</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Now lift the <strong>right</strong> leg. Press Start when ready.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => startRecording("right")}>
              Start
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setLeftResult(null); setPhase("ready_left"); }}>
              Redo left
            </Button>
          </div>
        </div>
      )}

      {phase === "recording_right" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Recording right leg...</p>
          <div className="flex items-center justify-center rounded-lg bg-muted py-4">
            <span className="text-3xl font-bold tabular-nums text-foreground">{countdown}</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPhase("ready_right")}>
            Restart right
          </Button>
        </div>
      )}

      {phase === "done" && comparison && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium" />
                  <th className="px-4 py-2 font-medium">Left</th>
                  <th className="px-4 py-2 font-medium">Right</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Peak accel</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{comparison.left.peakAccel.toFixed(3)}</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{comparison.right.peakAccel.toFixed(3)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Peak angle</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{comparison.left.peakAngle.toFixed(1)}°</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{comparison.right.peakAngle.toFixed(1)}°</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Hold stability</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{comparison.left.holdStability.toFixed(3)}</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{comparison.right.holdStability.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={cn(
            "flex items-center justify-center rounded-lg py-3 text-base font-bold",
            comparison.weakerLeg === "balanced"
              ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
              : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
          )}>
            {comparison.weakerLeg === "balanced"
              ? "Legs are balanced"
              : `${comparison.weakerLeg === "left" ? "Left" : "Right"} leg is ${comparison.weaknessPercent}% weaker`}
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={saved}>
              {saved ? "Saved" : "Save & Plot"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Retest
            </Button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{label} weakness over time</p>
            <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleClearHistory}>
              Clear
            </Button>
          </div>
          <HistoryChart readings={history} />
        </div>
      )}
    </div>
  );
}

type MuscleTestCardProps = {
  leftPoints: ImuChartPoint[];
  rightPoints: ImuChartPoint[];
  calibrated: boolean;
};

export function MuscleTestCard({ leftPoints, rightPoints, calibrated }: MuscleTestCardProps) {
  if (!calibrated) return null;

  return (
    <Card className="border-0 bg-white">
      <CardHeader className="px-6 pt-6 pb-3">
        <CardTitle className="text-foreground text-lg">Muscle activation tests</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border p-5">
            <SingleMuscleTest
              label="Extension"
              historyKey="extension-history"
              leftPoints={leftPoints}
              rightPoints={rightPoints}
            />
          </div>
          <div className="rounded-lg border border-border p-5">
            <SingleMuscleTest
              label="Flexion"
              historyKey="flexion-history"
              leftPoints={leftPoints}
              rightPoints={rightPoints}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
