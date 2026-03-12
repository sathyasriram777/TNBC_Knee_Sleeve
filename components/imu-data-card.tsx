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
};

export function ImuDataCard({ data = [] }: ImuDataCardProps) {
  const hasData = data.length > 0;

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
                />
                <Line
                  type="monotone"
                  dataKey="ay"
                  name="ay"
                  stroke="#82ca9d"
                  strokeWidth={1}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="az"
                  name="az"
                  stroke="#ffc658"
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              No IMU data yet. Record a session from Get Data.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
