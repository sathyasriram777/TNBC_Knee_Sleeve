"use client";

import { DualLiveImuCard } from "@/components/dual-live-imu-card";
import { MetricsCard } from "@/components/metrics-card";
import { MuscleTestCard } from "@/components/muscle-test-card";
import { RomTestCard } from "@/components/rom-test-card";
import { useDualBleImu } from "@/hooks/use-dual-ble-imu";
import type { ProfileUserType } from "@/lib/queries/profile";

type DiagnosticsChartsProps = {
  userType: ProfileUserType;
};

export function DiagnosticsCharts({ userType }: DiagnosticsChartsProps) {
  const ble = useDualBleImu();
  const isClinician = userType === "Clinician";
  const calibrated = ble.calibrationPhase === "done" && ble.assignment != null;

  return (
    <div className="flex flex-col gap-8 w-full">
      <DualLiveImuCard {...ble} isClinician={isClinician} />

      {calibrated && (
        <MetricsCard
          leftPoints={ble.left.points}
          rightPoints={ble.right.points}
        />
      )}

      {isClinician && (
        <>
          <RomTestCard
            leftPoints={ble.left.points}
            rightPoints={ble.right.points}
            calibrated={calibrated}
          />
          <MuscleTestCard
            leftPoints={ble.left.points}
            rightPoints={ble.right.points}
            calibrated={calibrated}
          />
        </>
      )}
    </div>
  );
}
