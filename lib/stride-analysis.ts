import type { ImuChartPoint } from "@/lib/chart-data";

const MIN_STRIDE_SAMPLES = 15;
const DEFAULT_PROMINENCE = 0.4;

function accelMag(p: ImuChartPoint): number {
  return Math.sqrt(p.ax ** 2 + p.ay ** 2 + p.az ** 2);
}

export function detectAccelPeaks(
  points: ImuChartPoint[],
  minDistance = MIN_STRIDE_SAMPLES,
  prominence = DEFAULT_PROMINENCE,
): number[] {
  const peaks: number[] = [];
  if (points.length < 3) return peaks;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = accelMag(points[i - 1]);
    const curr = accelMag(points[i]);
    const next = accelMag(points[i + 1]);
    if (curr > prev && curr > next) {
      const leftMin = findLeftMin(points, i, minDistance);
      const rightMin = findRightMin(points, i, minDistance);
      const prom = curr - Math.max(leftMin, rightMin);
      if (prom >= prominence) {
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
          peaks.push(i);
        }
      }
    }
  }
  return peaks;
}

function findLeftMin(points: ImuChartPoint[], peakIdx: number, window: number): number {
  let min = Infinity;
  const start = Math.max(0, peakIdx - window);
  for (let i = start; i < peakIdx; i++) {
    const v = accelMag(points[i]);
    if (v < min) min = v;
  }
  return min === Infinity ? 0 : min;
}

function findRightMin(points: ImuChartPoint[], peakIdx: number, window: number): number {
  let min = Infinity;
  const end = Math.min(points.length - 1, peakIdx + window);
  for (let i = peakIdx + 1; i <= end; i++) {
    const v = accelMag(points[i]);
    if (v < min) min = v;
  }
  return min === Infinity ? 0 : min;
}

export function extractStrides(
  points: ImuChartPoint[],
  peakIndices: number[],
): ImuChartPoint[][] {
  const strides: ImuChartPoint[][] = [];
  for (let i = 0; i < peakIndices.length - 1; i++) {
    const start = peakIndices[i];
    const end = peakIndices[i + 1];
    if (end - start >= MIN_STRIDE_SAMPLES) {
      strides.push(points.slice(start, end));
    }
  }
  return strides;
}

/**
 * Agitation = standard deviation of acceleration magnitude within a stride.
 * Captures how variable/jerky the movement is, independent of orientation.
 */
function strideAgitation(stride: ImuChartPoint[]): number {
  if (stride.length < 2) return 0;
  const mags = stride.map(accelMag);
  const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
  const variance = mags.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (mags.length - 1);
  return Math.sqrt(variance);
}

export type CompensationResult = {
  compensating: boolean;
  healthyAgitation: number;
  unhealthyAgitation: number;
  difference: number;
  stridePairs: number;
};

/**
 * Compare agitation between healthy and unhealthy strides.
 * If the unhealthy leg's agitation differs from the healthy leg's
 * by more than `threshold` (fraction, e.g. 0.25 = 25%), the patient
 * is compensating.
 */
export function computeLiveCompensation(
  healthyStrides: ImuChartPoint[][],
  unhealthyStrides: ImuChartPoint[][],
  threshold: number,
): CompensationResult | null {
  if (healthyStrides.length === 0 || unhealthyStrides.length === 0) return null;

  const hAgi = strideAgitation(healthyStrides[healthyStrides.length - 1]);
  const uAgi = strideAgitation(unhealthyStrides[unhealthyStrides.length - 1]);

  return buildResult(hAgi, uAgi, threshold, 1);
}

export function computeSnapshotCompensation(
  healthyStrides: ImuChartPoint[][],
  unhealthyStrides: ImuChartPoint[][],
  threshold: number,
): CompensationResult | null {
  if (healthyStrides.length === 0 || unhealthyStrides.length === 0) return null;

  const hAgitations = healthyStrides.map(strideAgitation);
  const uAgitations = unhealthyStrides.map(strideAgitation);

  const hMean = hAgitations.reduce((a, b) => a + b, 0) / hAgitations.length;
  const uMean = uAgitations.reduce((a, b) => a + b, 0) / uAgitations.length;

  const pairs = Math.min(healthyStrides.length, unhealthyStrides.length);
  return buildResult(hMean, uMean, threshold, pairs);
}

function buildResult(
  healthyAgitation: number,
  unhealthyAgitation: number,
  threshold: number,
  stridePairs: number,
): CompensationResult {
  const avg = (healthyAgitation + unhealthyAgitation) / 2;
  const difference = avg > 0 ? Math.abs(unhealthyAgitation - healthyAgitation) / avg : 0;

  return {
    compensating: difference <= threshold,
    healthyAgitation,
    unhealthyAgitation,
    difference,
    stridePairs,
  };
}

const AGITATION_WINDOW = 100;
const AGITATION_MIN_SAMPLES = 20;
const DEFAULT_AGITATION_THRESHOLD = 0.20;

/**
 * Compute rolling agitation (stddev of accel magnitude) over
 * the most recent AGITATION_WINDOW samples.
 */
function computeRollingAgitation(points: ImuChartPoint[]): number {
  const recent = points.slice(-AGITATION_WINDOW);
  if (recent.length < AGITATION_MIN_SAMPLES) return 0;
  const mags = recent.map(accelMag);
  const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
  const variance = mags.reduce((sum, v) => sum + (v - mean) ** 2, 0) / mags.length;
  return Math.sqrt(variance);
}

export type AgitationResult = {
  compensating: boolean;
  leftAgitation: number;
  rightAgitation: number;
  /** Relative difference as a fraction (0 = identical, 1 = 100% different) */
  difference: number;
};

/**
 * Compare overall agitation between left and right legs.
 *   - Same agitation level  → Not Compensating
 *   - One agitates more     → Compensating
 */
export function computeAgitationComparison(
  leftPoints: ImuChartPoint[],
  rightPoints: ImuChartPoint[],
  threshold = DEFAULT_AGITATION_THRESHOLD,
): AgitationResult | null {
  const leftAgi = computeRollingAgitation(leftPoints);
  const rightAgi = computeRollingAgitation(rightPoints);

  if (leftAgi === 0 && rightAgi === 0) return null;

  const avg = (leftAgi + rightAgi) / 2;
  const difference = avg > 0 ? Math.abs(leftAgi - rightAgi) / avg : 0;

  return {
    compensating: difference > threshold,
    leftAgitation: leftAgi,
    rightAgitation: rightAgi,
    difference,
  };
}
