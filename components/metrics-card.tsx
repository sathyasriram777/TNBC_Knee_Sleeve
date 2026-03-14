"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImuChartPoint } from "@/lib/chart-data";
import { computeGaitMetrics, type GaitMetrics } from "@/lib/gait-metrics";
import { cn } from "@/lib/utils";

type MetricsCardProps = {
  leftPoints: ImuChartPoint[];
  rightPoints: ImuChartPoint[];
};

function fmt(v: number | null, decimals = 1, suffix = ""): string {
  if (v == null) return "--";
  return `${v.toFixed(decimals)}${suffix}`;
}

function MetricTile({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "good" | "warning" | "neutral";
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background px-4 py-4 text-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xl font-bold tabular-nums",
          status === "good" && "text-green-600 dark:text-green-400",
          status === "warning" && "text-amber-600 dark:text-amber-400",
          (!status || status === "neutral") && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function symmetryStatus(v: number | null): "good" | "warning" | "neutral" {
  if (v == null) return "neutral";
  return v >= 85 ? "good" : "warning";
}

function stabilityStatus(v: number | null): "good" | "warning" | "neutral" {
  if (v == null) return "neutral";
  return v >= 70 ? "good" : "warning";
}

function variabilityStatus(v: number | null): "good" | "warning" | "neutral" {
  if (v == null) return "neutral";
  return v <= 15 ? "good" : "warning";
}

export function MetricsCard({ leftPoints, rightPoints }: MetricsCardProps) {
  const m: GaitMetrics = useMemo(
    () => computeGaitMetrics(leftPoints, rightPoints),
    [leftPoints, rightPoints],
  );

  return (
    <Card className="border-0 bg-white">
      <CardHeader className="px-6 pt-6 pb-3">
        <CardTitle className="text-foreground text-lg">Gait metrics</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricTile
            label="Symmetry index"
            value={fmt(m.symmetryIndex, 1, "%")}
            status={symmetryStatus(m.symmetryIndex)}
          />
          <MetricTile
            label="Cadence (L)"
            value={fmt(m.cadenceLeft, 0, " spm")}
          />
          <MetricTile
            label="Cadence (R)"
            value={fmt(m.cadenceRight, 0, " spm")}
          />
          <MetricTile
            label="ROM (L)"
            value={fmt(m.romLeft, 1, "°")}
          />
          <MetricTile
            label="ROM (R)"
            value={fmt(m.romRight, 1, "°")}
          />
          <MetricTile
            label="Peak flexion (L)"
            value={fmt(m.peakFlexionLeft, 1, "°")}
          />
          <MetricTile
            label="Peak flexion (R)"
            value={fmt(m.peakFlexionRight, 1, "°")}
          />
          <MetricTile
            label="Stability (L)"
            value={fmt(m.stabilityLeft, 0, "/100")}
            status={stabilityStatus(m.stabilityLeft)}
          />
          <MetricTile
            label="Stability (R)"
            value={fmt(m.stabilityRight, 0, "/100")}
            status={stabilityStatus(m.stabilityRight)}
          />
          <MetricTile
            label="Stride variability (L)"
            value={fmt(m.strideVariabilityLeft, 1, "%")}
            status={variabilityStatus(m.strideVariabilityLeft)}
          />
          <MetricTile
            label="Stride variability (R)"
            value={fmt(m.strideVariabilityRight, 1, "%")}
            status={variabilityStatus(m.strideVariabilityRight)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
