"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ImuDataCard } from "@/components/imu-data-card";
import { useBleImu, type BleImuFilterMode } from "@/hooks/use-ble-imu";
import { cn } from "@/lib/utils";

const FILTER_MODES: { value: BleImuFilterMode; label: string }[] = [
  { value: "raw", label: "Raw" },
  { value: "moving", label: "Moving avg" },
  { value: "median", label: "Median" },
];

export function LiveImuCard() {
  const {
    connect,
    disconnect,
    isConnected,
    status,
    statusMessage,
    points,
    clearPoints,
    filterMode,
    setFilterMode,
    windowSize,
    setWindowSize,
    supported,
  } = useBleImu();

  return (
    <Card className="border-0 bg-white w-full">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 px-8 pt-8 pb-4">
        <CardTitle className="text-foreground">Live IMU (Bluetooth)</CardTitle>
        <div className="flex items-center gap-2">
          {supported ? (
            isConnected ? (
              <>
                <span className="text-muted-foreground text-sm truncate max-w-[180px]">
                  {statusMessage}
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={disconnect}
                >
                  Disconnect
                </Button>
                {points.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearPoints}
                  >
                    Clear
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={connect}
                disabled={status === "scanning"}
              >
                {status === "scanning" ? "Scanning…" : "Connect"}
              </Button>
            )
          ) : (
            <span className="text-muted-foreground text-sm">
              Web Bluetooth not supported
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8 space-y-4">
        {status === "error" && (
          <p className="text-destructive text-sm">{statusMessage}</p>
        )}
        {supported && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Filter:</span>
              {FILTER_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterMode(value)}
                  className={cn(
                    "rounded px-2 py-1 text-sm",
                    filterMode === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className={cn(
                "flex items-center gap-2",
                filterMode === "raw" && "opacity-50 pointer-events-none"
              )}
            >
              <Label htmlFor="ble-window" className="text-sm text-muted-foreground">
                Window:
              </Label>
              <input
                id="ble-window"
                type="range"
                min={3}
                max={21}
                step={2}
                value={windowSize}
                onChange={(e) => setWindowSize(parseInt(e.target.value, 10))}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm w-6">
                {windowSize}
              </span>
            </div>
          </div>
        )}
        <div className="min-h-[280px]">
          <ImuDataCard data={points} live />
        </div>
        {supported && !isConnected && (
          <p className="text-muted-foreground text-sm">
            Click Connect to see all nearby Bluetooth devices; choose your IMU
            device. Requires HTTPS or localhost.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
