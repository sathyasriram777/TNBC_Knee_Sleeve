import type { ImuChartPoint } from "@/lib/chart-data";

export type RomResult = {
  peakAngle: number;
};

export type RomComparison = {
  left: RomResult;
  right: RomResult;
  deficitSide: "left" | "right" | "balanced";
  deficitPercent: number;
  angleDifference: number;
};

// /**
//  * Get the current resting ang2 from the most recent points in the buffer.
//  * Averages the last few samples to smooth out noise.
//  */
// export function getBaselineAngle(points: ImuChartPoint[], samples = 10): number {
//   const tail = points.slice(-samples);
//   const angles = tail.map((p) => p.ang2).filter((v): v is number => v != null);
//   if (angles.length === 0) return 0;
//   return angles.reduce((a, b) => a + b, 0) / angles.length;
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getBaselineAngle(_points: ImuChartPoint[], _samples = 10): number {
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function analyzeRomRecording(points: ImuChartPoint[], _baseline?: number): RomResult {
  if (points.length === 0) {
    return { peakAngle: 0 };
  }

  const angles = points
    .map((p) => p.ang2)
    .filter((v): v is number => v != null);

  if (angles.length === 0) {
    return { peakAngle: 0 };
  }

  // Use the full sweep (max - min) so wrapping past 90° doesn't matter.
  // The recording captures rest → lift → drop, so the range IS the ROM.
  const peakAngle = Math.max(...angles) - Math.min(...angles);

  return { peakAngle };
}

export function compareRom(
  left: RomResult,
  right: RomResult,
): RomComparison {
  const stronger = Math.max(left.peakAngle, right.peakAngle);
  const angleDifference = Math.abs(left.peakAngle - right.peakAngle);

  if (stronger === 0) {
    return { left, right, deficitSide: "balanced", deficitPercent: 0, angleDifference: 0 };
  }

  const deficitPercent = Math.round((angleDifference / stronger) * 100);

  if (deficitPercent < 5) {
    return { left, right, deficitSide: "balanced", deficitPercent, angleDifference };
  }

  return {
    left,
    right,
    deficitSide: left.peakAngle < right.peakAngle ? "left" : "right",
    deficitPercent,
    angleDifference,
  };
}
