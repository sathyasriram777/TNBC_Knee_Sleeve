"use client";

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
import type { ImuChartPoint } from "@/lib/chart-data";

type ImuDataCardProps = {
  data?: ImuChartPoint[];
  /** Set true for live/streaming data so the chart redraws in real time without animation. */
  live?: boolean;
};

function angleStats(points: ImuChartPoint[]) {
  const withAng1 = points.filter((p) => p.ang1 != null) as (ImuChartPoint & { ang1: number })[];
  const withAng2 = points.filter((p) => p.ang2 != null) as (ImuChartPoint & { ang2: number })[];
  const last = points[points.length - 1];
  return {
    ang1: last?.ang1 ?? null,
    ang2: last?.ang2 ?? null,
    ang1Min: withAng1.length ? Math.min(...withAng1.map((p) => p.ang1)) : null,
    ang1Max: withAng1.length ? Math.max(...withAng1.map((p) => p.ang1)) : null,
    ang2Min: withAng2.length ? Math.min(...withAng2.map((p) => p.ang2)) : null,
    ang2Max: withAng2.length ? Math.max(...withAng2.map((p) => p.ang2)) : null,
  };
}

export function ImuDataCard({ data = [], live = false }: ImuDataCardProps) {
  const hasData = data.length > 0;
  const angles = hasData ? angleStats(data) : null;

  return (
    <Card className="border-0 bg-white w-full">
      <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-4">
        <CardTitle className="text-foreground">IMU Data</CardTitle>
        <Button variant="secondary" size="sm">
          Insights
        </Button>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="w-full overflow-hidden rounded-lg border border-border bg-background min-h-[280px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={data}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => {
                    try {
                      const d = new Date(v);
                      return isNaN(d.getTime()) ? String(v) : d.toLocaleTimeString();
                    } catch {
                      return String(v);
                    }
                  }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(v) => {
                    try {
                      const d = new Date(v);
                      return isNaN(d.getTime()) ? String(v) : d.toLocaleTimeString();
                    } catch {
                      return String(v);
                    }
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ax"
                  name="ax"
                  stroke="#8884d8"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={!live}
                />
                <Line
                  type="monotone"
                  dataKey="ay"
                  name="ay"
                  stroke="#82ca9d"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={!live}
                />
                <Line
                  type="monotone"
                  dataKey="az"
                  name="az"
                  stroke="#ffc658"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={!live}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              No IMU data yet. Record a session from Get Data.
            </div>
          )}
        </div>
        {angles && (angles.ang1 != null || angles.ang2 != null) && (
          <div className="mt-3 flex flex-wrap gap-6 text-sm text-muted-foreground">
            {angles.ang1 != null && (
              <span>
                ang1: <strong className="text-foreground">{angles.ang1.toFixed(1)}°</strong>
                {angles.ang1Min != null && angles.ang1Max != null && (
                  <> (min {angles.ang1Min.toFixed(1)}, max {angles.ang1Max.toFixed(1)})</>
                )}
              </span>
            )}
            {angles.ang2 != null && (
              <span>
                ang2: <strong className="text-foreground">{angles.ang2.toFixed(1)}°</strong>
                {angles.ang2Min != null && angles.ang2Max != null && (
                  <> (min {angles.ang2Min.toFixed(1)}, max {angles.ang2Max.toFixed(1)})</>
                )}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
