import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPatientByIdForUser } from "@/lib/queries/profile";
import {
  getLatestSessionForPatient,
  getPayloadsBySessionId,
} from "@/lib/queries/get-data";
import { GetDataCard } from "@/components/get-data-cards";
import { Button } from "@/components/ui/button";

export default async function GetDataPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const { patient: patientId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !patientId) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-muted-foreground">Select a patient to collect data.</p>
        <Button asChild variant="outline">
          <Link href="/protected/profile">Back to Profile</Link>
        </Button>
      </div>
    );
  }

  const patient = await getPatientByIdForUser(patientId, user.id);
  if (!patient) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button asChild variant="outline">
          <Link href="/protected/profile">Back to Profile</Link>
        </Button>
      </div>
    );
  }

  const latestSession = await getLatestSessionForPatient(patient.id);
  const initialPayloads = latestSession
    ? await getPayloadsBySessionId(latestSession.id)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <GetDataCard
        patientId={patient.id}
        initialSession={
          latestSession
            ? {
                id: latestSession.id,
                status: latestSession.status,
                createdAt: latestSession.createdAt.toISOString(),
                updatedAt: latestSession.updatedAt.toISOString(),
                payloadCount: latestSession._count.payloads,
              }
            : null
        }
        initialPayloads={initialPayloads.map((p: { id: string; data: unknown; createdAt: Date }) => ({
          id: p.id,
          data: p.data,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
