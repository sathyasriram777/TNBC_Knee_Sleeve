import { EmgDataCard } from "@/components/emg-data-card";
import { ImuDataCard } from "@/components/imu-data-card";
import { PatientInfoCard } from "@/components/patient-info-card";

export default function DiagnosticsPage() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
      <div className="flex flex-1 flex-col gap-8 min-w-0">
        <EmgDataCard />
        <ImuDataCard />
      </div>
      <div className="w-full lg:w-[380px] lg:shrink-0 flex">
        <PatientInfoCard />
      </div>
    </div>
  );
}
