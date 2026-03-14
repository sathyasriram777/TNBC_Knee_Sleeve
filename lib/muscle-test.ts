import type { ImuChartPoint } from "@/lib/chart-data";
import { analyzeRomRecording } from "@/lib/rom-test";

export type MuscleTestResult = {
  peakAccel: number;
  peakAngle: number;
  holdStability: number;
};

export type MuscleComparison = {
  weakerLeg: "left" | "right" | "balanced";
  weaknessPercent: number;
  left: MuscleTestResult;
  right: MuscleTestResult;
};

function accelMag(p: ImuChartPoint): number {
  return Math.sqrt(p.ax ** 2 + p.ay ** 2 + p.az ** 2);
}

/**
 * Analyze a 3-second hold recording from one leg.
 * Extracts peak acceleration magnitude, peak ang2, and hold stability
 * (stddev of accel magnitude — lower = steadier hold).
 */
export function analyzeHoldRecording(points: ImuChartPoint[], baseline = 0): MuscleTestResult {
  if (points.length === 0) {
    return { peakAccel: 0, peakAngle: 0, holdStability: 0 };
  }

  const mags = points.map(accelMag);
  const peakAccel = Math.max(...mags);

  const { peakAngle } = analyzeRomRecording(points, baseline);

  const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
  const variance =
    mags.length > 1
      ? mags.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (mags.length - 1)
      : 0;
  const holdStability = Math.sqrt(variance);

  return { peakAccel, peakAngle, holdStability };
}

/**
 * Compare two leg test results.
 * Returns which leg is weaker and by what percentage.
 */
export function compareMuscleTests(
  leftResult: MuscleTestResult,
  rightResult: MuscleTestResult,
): MuscleComparison {
  const leftScore = leftResult.peakAccel;
  const rightScore = rightResult.peakAccel;
  const stronger = Math.max(leftScore, rightScore);

  if (stronger === 0) {
    return { weakerLeg: "balanced", weaknessPercent: 0, left: leftResult, right: rightResult };
  }

  const diff = Math.abs(leftScore - rightScore) / stronger;
  const weaknessPercent = Math.round(diff * 100);

  if (weaknessPercent < 5) {
    return { weakerLeg: "balanced", weaknessPercent, left: leftResult, right: rightResult };
  }

  return {
    weakerLeg: leftScore < rightScore ? "left" : "right",
    weaknessPercent,
    left: leftResult,
    right: rightResult,
  };
}
