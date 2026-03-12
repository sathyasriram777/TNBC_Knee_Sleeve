import { createClient } from "@/lib/supabase/server";
import { getPatientByIdForUser } from "@/lib/queries/profile";
import {
  getLatestSessionForPatient,
  getPayloadsBySessionId,
} from "@/lib/queries/get-data";
import { DiagnosticsCharts } from "@/components/diagnostics-charts";
import { PatientInfoCard } from "@/components/patient-info-card";

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const { patient: patientId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const patient =
    user && patientId
      ? await getPatientByIdForUser(patientId, user.id)
      : null;

  const latestSession =
    patient ? await getLatestSessionForPatient(patient.id) : null;
  const initialPayloads =
    latestSession
      ? await getPayloadsBySessionId(latestSession.id)
      : [];

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
      <div className="flex flex-1 flex-col gap-8 min-w-0">
        <DiagnosticsCharts
          patientId={patient?.id ?? null}
          sessionId={latestSession?.id ?? null}
          initialPayloads={initialPayloads.map((p) => ({
            id: p.id,
            data: p.data,
            createdAt: p.createdAt.toISOString(),
          }))}
        />
      </div>
      <div className="w-full lg:w-[380px] lg:shrink-0 flex">
        <PatientInfoCard
          name={patient?.name ?? undefined}
          patientId={patient?.id ?? undefined}
        />
      </div>
    </div>
  );
}
