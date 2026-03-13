/**
 * Transform raw SensorPayload rows into chart-ready arrays.
 * Reads payload.data (emg, ax, ay, az, t) - structure matches ESP upload.
 */

export type PayloadRow = {
  id: string;
  data: unknown;
  createdAt: string;
};

export type EmgChartPoint = {
  time: string;
  value: number;
};

export type ImuChartPoint = {
  time: string;
  ax: number;
  ay: number;
  az: number;
  /** Angle from atan2(ay, az) in degrees */
  ang1?: number;
  /** Angle from atan2(az, ay) in degrees */
  ang2?: number;
};

const RAD2DEG = 180 / Math.PI;

/** Compute ang1 = atan2(ay, az) and ang2 = atan2(az, ay) in degrees. */
export function imuAnglesFromAyAz(ay: number, az: number): { ang1: number; ang2: number } {
  return {
    ang1: Math.atan2(ay, az) * RAD2DEG,
    ang2: Math.atan2(az, ay) * RAD2DEG,
  };
}

function getPayloadData(p: PayloadRow): Record<string, unknown> {
  const d = p.data;
  if (d && typeof d === "object" && !Array.isArray(d)) return d as Record<string, unknown>;
  return {};
}

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

/** Flatten payloads; if data has samples[], expand to one point per sample. */
export function payloadsToEmgData(payloads: PayloadRow[]): EmgChartPoint[] {
  const out: EmgChartPoint[] = [];
  for (const p of payloads) {
    const d = getPayloadData(p);
    const samples = d.samples as unknown[] | undefined;
    if (Array.isArray(samples)) {
      for (const s of samples) {
        const row = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
        const t = row.t ?? p.createdAt;
        const emg = Array.isArray(row.emg) ? (row.emg[0] ?? 0) : row.emg;
        out.push({ time: String(t), value: num(emg) });
      }
    } else {
      out.push({
        time: String(d.t ?? p.createdAt),
        value: num(d.emg),
      });
    }
  }
  return out;
}

export function payloadsToImuData(payloads: PayloadRow[]): ImuChartPoint[] {
  const out: ImuChartPoint[] = [];
  for (const p of payloads) {
    const d = getPayloadData(p);
    const samples = d.samples as unknown[] | undefined;
    if (Array.isArray(samples)) {
      for (const s of samples) {
        const row = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
        const imu = row.imu && typeof row.imu === "object" ? (row.imu as Record<string, unknown>) : {};
        const t = row.t ?? p.createdAt;
        out.push({
          time: String(t),
          ax: num(imu.ax ?? (d as Record<string, unknown>).ax),
          ay: num(imu.ay ?? (d as Record<string, unknown>).ay),
          az: num(imu.az ?? (d as Record<string, unknown>).az),
        });
      }
    } else {
      out.push({
        time: String(d.t ?? p.createdAt),
        ax: num(d.ax),
        ay: num(d.ay),
        az: num(d.az),
      });
    }
  }
  return out;
}
