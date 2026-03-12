import { AccountSettings } from "@/components/accountSettings";
import { Patients } from "@/components/patients";
import { ProfileInfo } from "@/components/profileInfo";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-8 min-w-0">
        <ProfileInfo />
        <AccountSettings />
      </div>
      <div className="w-full lg:w-[400px] lg:shrink-0">
        <Patients />
      </div>
    </div>
  );
}