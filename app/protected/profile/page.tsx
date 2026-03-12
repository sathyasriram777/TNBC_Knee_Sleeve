import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId, getPatientsByUserId } from "@/lib/queries/profile";
import { AccountSettings } from "@/components/accountSettings";
import { Patients } from "@/components/patients";
import { ProfileInfo } from "@/components/profileInfo";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfileByUserId(user.id) : null;
  const initialPatients = user ? await getPatientsByUserId(user.id) : [];

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-8 min-w-0">
        <ProfileInfo initialName={profile?.name ?? null} />
        <AccountSettings />
      </div>
      <div className="w-full lg:w-[400px] lg:shrink-0">
        <Patients initialPatients={initialPatients} />
      </div>
    </div>
  );
}