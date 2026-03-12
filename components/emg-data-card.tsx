"use client";

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
import type { EmgChartPoint } from "@/lib/chart-data";

type EmgDataCardProps = {
  data?: EmgChartPoint[];
};

export function EmgDataCard({ data = [] }: EmgDataCardProps) {
  const hasData = data.length > 0;

  return (
    <Card className="border-0 bg-white w-full">
      <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-4">
        <CardTitle className="text-foreground">EMG Data</CardTitle>
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
                  formatter={(value) => [typeof value === "number" ? value.toFixed(4) : value, "EMG"]}
                  labelFormatter={(v) => {
                    try {
                      const d = new Date(v);
                      return isNaN(d.getTime()) ? String(v) : d.toLocaleTimeString();
                    } catch {
                      return String(v);
                    }
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              No EMG data yet. Record a session from Get Data.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
