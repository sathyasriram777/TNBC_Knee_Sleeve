import { createClient } from "@/lib/supabase/server";
import {
  getProfileByUserId,
  getPatientsByUserId,
  getReportsForPatientUserId,
} from "@/lib/queries/profile";
import { syncUserToDb } from "@/lib/auth/sync-user";
import { AccountSettings } from "@/components/accountSettings";
import { Patients } from "@/components/patients";
import { ProfileInfo } from "@/components/profileInfo";
import { Reports } from "@/components/reports";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await syncUserToDb(user);
  }
  const profile = user ? await getProfileByUserId(user.id) : null;
  const initialPatients = user ? await getPatientsByUserId(user.id) : [];
  const initialReports = user ? await getReportsForPatientUserId(user.id) : [];
  const patientRecordId =
    profile?.type === "Patient" && initialPatients.length > 0
      ? initialPatients[0].id
      : null;

  const isPatient = profile?.type === "Patient";

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-8 min-w-0">
        <ProfileInfo initialName={profile?.name ?? null} initialEmail={profile?.email ?? null} />
        <AccountSettings initialEmail={profile?.email ?? null} />
      </div>
      <div className="w-full lg:w-[400px] lg:shrink-0">
        {isPatient ? (
          <Reports
            initialReports={initialReports}
            patientId={patientRecordId}
          />
        ) : (
          <Patients initialPatients={initialPatients} />
        )}
      </div>
    </div>
  );
}