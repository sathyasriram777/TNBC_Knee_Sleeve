import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PatientInfoCardProps {
  /** From DB */
  name?: string | null;
  patientId?: string | null;
  /** Not in DB yet – leave blank if not provided */
  age?: number | null;
  emgActivity?: string | null;
  rangeOfMotion?: string | null;
  motorSkillExercises?: string | null;
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function PatientInfoCard({
  name,
  patientId,
  age,
  emgActivity,
  rangeOfMotion,
  motorSkillExercises,
}: PatientInfoCardProps) {
  return (
    <Card className="border-0 bg-white w-full h-full flex flex-col">
      <CardHeader className="flex flex-col items-center px-8 pt-8 pb-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background">
          <Image
            src="/userIconBig.svg"
            alt="Patient"
            width={64}
            height={64}
            className="opacity-80"
          />
        </div>
        <CardTitle className="text-primary mt-2">Patient Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-8 pb-8 flex-1">
        <p className="font-medium text-foreground">{formatValue(name)}</p>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-semibold text-foreground">Patient ID:</dt>
            <dd className="text-muted-foreground">{formatValue(patientId)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Age:</dt>
            <dd className="text-muted-foreground">{formatValue(age)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">EMG Activity:</dt>
            <dd className="text-muted-foreground">{formatValue(emgActivity)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Range of Motion:</dt>
            <dd className="text-muted-foreground">{formatValue(rangeOfMotion)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Motor Skill Exercises:</dt>
            <dd className="text-muted-foreground">{formatValue(motorSkillExercises)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
