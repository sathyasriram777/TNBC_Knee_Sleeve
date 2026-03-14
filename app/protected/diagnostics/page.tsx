import { createClient } from "@/lib/supabase/server";
import { syncUserToDb } from "@/lib/auth/sync-user";
import { getProfileByUserId } from "@/lib/queries/profile";
import { DiagnosticsCharts } from "@/components/diagnostics-charts";

export default async function DiagnosticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncUserToDb(user);
  }

  const profile = user ? await getProfileByUserId(user.id) : null;
  const userType = profile?.type ?? "Patient";

  return (
    <div className="flex flex-col gap-8 w-full">
      <DiagnosticsCharts userType={userType} />
    </div>
  );
}
