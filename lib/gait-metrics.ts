import type { ImuChartPoint } from "@/lib/chart-data";
import { detectAccelPeaks, extractStrides } from "@/lib/stride-analysis";

export type GaitMetrics = {
  /** Range of motion (max ang2 − min ang2) in degrees, per leg */
  romLeft: number | null;
  romRight: number | null;
  /** Peak knee flexion angle (max ang2) per leg */
  peakFlexionLeft: number | null;
  peakFlexionRight: number | null;
  /** Steps per minute, derived from stride peaks */
  cadenceLeft: number | null;
  cadenceRight: number | null;
  /** Gait symmetry index: 100% = perfectly symmetric, 0% = fully asymmetric */
  symmetryIndex: number | null;
  /** Coefficient of variation of stride duration (lower = more regular) per leg */
  strideVariabilityLeft: number | null;
  strideVariabilityRight: number | null;
  /** Overall stability score 0-100 (lower accel variance = higher score) per leg */
  stabilityLeft: number | null;
  stabilityRight: number | null;
};

function ang2Values(pts: ImuChartPoint[]): number[] {
  return pts.map((p) => p.ang2).filter((v): v is number => v != null);
}

function computeROM(pts: ImuChartPoint[]): number | null {
  const vals = ang2Values(pts);
  if (vals.length < 2) return null;
  return Math.max(...vals) - Math.min(...vals);
}

function computePeakFlexion(pts: ImuChartPoint[]): number | null {
  const vals = ang2Values(pts);
  if (vals.length === 0) return null;
  return Math.max(...vals);
}

function accelMag(p: ImuChartPoint): number {
  return Math.sqrt(p.ax ** 2 + p.ay ** 2 + p.az ** 2);
}

/**
 * Estimate cadence (steps/min) from detected stride peaks.
 * Assumes ~20 Hz sample rate from BLE IMU.
 */
function computeCadence(pts: ImuChartPoint[], sampleRateHz = 20): number | null {
  const peaks = detectAccelPeaks(pts);
  if (peaks.length < 2) return null;
  const firstPeak = peaks[0];
  const lastPeak = peaks[peaks.length - 1];
  const sampleSpan = lastPeak - firstPeak;
  if (sampleSpan === 0) return null;
  const durationSec = sampleSpan / sampleRateHz;
  const strides = peaks.length - 1;
  return (strides / durationSec) * 60;
}

/**
 * Coefficient of variation of stride durations.
 * Returns a percentage (0 = perfectly uniform, higher = more variable).
 */
function computeStrideVariability(pts: ImuChartPoint[]): number | null {
  const peaks = detectAccelPeaks(pts);
  if (peaks.length < 3) return null;
  const durations: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    durations.push(peaks[i] - peaks[i - 1]);
  }
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  if (mean === 0) return null;
  const variance = durations.reduce((s, d) => s + (d - mean) ** 2, 0) / durations.length;
  return (Math.sqrt(variance) / mean) * 100;
}

/**
 * Stability score 0–100 based on acceleration variability.
 * Maps stddev of accel magnitude to a 0-100 scale (lower variance = higher score).
 */
function computeStability(pts: ImuChartPoint[]): number | null {
  if (pts.length < 10) return null;
  const mags = pts.map(accelMag);
  const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
  const variance = mags.reduce((s, v) => s + (v - mean) ** 2, 0) / mags.length;
  const stddev = Math.sqrt(variance);
  const score = Math.max(0, Math.min(100, 100 - stddev * 50));
  return Math.round(score * 10) / 10;
}

/**
 * Gait symmetry index comparing left and right strides.
 * Uses Robinson's symmetry index: 100 * (1 - |L-R| / max(L,R))
 * where L and R are mean stride agitation values.
 */
function computeSymmetryIndex(
  leftPts: ImuChartPoint[],
  rightPts: ImuChartPoint[],
): number | null {
  const leftStrides = extractStrides(leftPts, detectAccelPeaks(leftPts));
  const rightStrides = extractStrides(rightPts, detectAccelPeaks(rightPts));
  if (leftStrides.length === 0 || rightStrides.length === 0) return null;

  const strideAgitation = (stride: ImuChartPoint[]): number => {
    const mags = stride.map(accelMag);
    const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
    const variance = mags.reduce((s, v) => s + (v - mean) ** 2, 0) / mags.length;
    return Math.sqrt(variance);
  };

  const leftMean =
    leftStrides.map(strideAgitation).reduce((a, b) => a + b, 0) / leftStrides.length;
  const rightMean =
    rightStrides.map(strideAgitation).reduce((a, b) => a + b, 0) / rightStrides.length;

  const maxVal = Math.max(leftMean, rightMean);
  if (maxVal === 0) return 100;
  return Math.round((1 - Math.abs(leftMean - rightMean) / maxVal) * 1000) / 10;
}

export function computeGaitMetrics(
  leftPts: ImuChartPoint[],
  rightPts: ImuChartPoint[],
): GaitMetrics {
  return {
    romLeft: computeROM(leftPts),
    romRight: computeROM(rightPts),
    peakFlexionLeft: computePeakFlexion(leftPts),
    peakFlexionRight: computePeakFlexion(rightPts),
    cadenceLeft: computeCadence(leftPts),
    cadenceRight: computeCadence(rightPts),
    symmetryIndex: computeSymmetryIndex(leftPts, rightPts),
    strideVariabilityLeft: computeStrideVariability(leftPts),
    strideVariabilityRight: computeStrideVariability(rightPts),
    stabilityLeft: computeStability(leftPts),
    stabilityRight: computeStability(rightPts),
  };
}
