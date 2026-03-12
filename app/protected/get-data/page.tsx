import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPatientByIdForUser } from "@/lib/queries/profile";
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

  return (
    <div className="flex flex-col gap-8">
      <GetDataCard patientId={patient.id} />
    </div>
  );
}
