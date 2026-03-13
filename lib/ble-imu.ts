/**
 * BLE IMU constants and filter helpers for Nano33-IMU real-time stream.
 * Characteristic sends CSV: "ax,ay,az"
 */

export const BLE_IMU_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
export const BLE_IMU_CHAR_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
export const BLE_IMU_DEVICE_NAME = "Nano33-IMU";

export type BleImuFilterMode = "raw" | "moving" | "median";

export function movingAvg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1]! + s[m]!) / 2 : s[m]!;
}

export function parseBleImuCsv(raw: string): { ax: number; ay: number; az: number } | null {
  const parts = raw.trim().split(",");
  if (parts.length < 3) return null;
  const ax = parseFloat(parts[0]!);
  const ay = parseFloat(parts[1]!);
  const az = parseFloat(parts[2]!);
  if (Number.isNaN(ax) || Number.isNaN(ay) || Number.isNaN(az)) return null;
  return { ax, ay, az };
}
