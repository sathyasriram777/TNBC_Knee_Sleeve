"use client";

import { useCallback, useEffect, useState } from "react";
import { payloadsToEmgData, payloadsToImuData, type PayloadRow } from "@/lib/chart-data";
import { EmgDataCard } from "@/components/emg-data-card";
import { ImuDataCard } from "@/components/imu-data-card";

const POLL_INTERVAL_MS = 2000;

type DiagnosticsChartsProps = {
  patientId: string | null;
  sessionId: string | null;
  initialPayloads: PayloadRow[];
};

export function DiagnosticsCharts({
  patientId,
  sessionId,
  initialPayloads,
}: DiagnosticsChartsProps) {
  const [payloads, setPayloads] = useState<PayloadRow[]>(initialPayloads);

  const fetchSession = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/get-data/session/${sid}`);
      if (!res.ok) return;
      const data = (await res.json()) as { payloads: PayloadRow[] };
      setPayloads(
        data.payloads.map((p) => ({
          id: p.id,
          data: p.data,
          createdAt: p.createdAt,
        }))
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const id = setInterval(() => fetchSession(sessionId), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionId, fetchSession]);

  const emgData = payloadsToEmgData(payloads);
  const imuData = payloadsToImuData(payloads);

  return (
    <>
      <EmgDataCard data={emgData} />
      <ImuDataCard data={imuData} />
    </>
  );
}
