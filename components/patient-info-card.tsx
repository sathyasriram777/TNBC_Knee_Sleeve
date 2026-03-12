import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PatientInfoCardProps {
  name?: string;
  patientId?: string;
  age?: number;
  emgActivity?: string;
  rangeOfMotion?: string;
  motorSkillExercises?: string;
}

export function PatientInfoCard({
  name = "John Doe",
  patientId = "001PD24",
  age = 35,
  emgActivity = "Irregular Muscular Activity",
  rangeOfMotion = "............",
  motorSkillExercises = "Exercises for hand dexterity and coordination",
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
        <p className="font-medium text-foreground">{name}</p>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-semibold text-foreground">Patient ID:</dt>
            <dd className="text-muted-foreground">{patientId}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Age:</dt>
            <dd className="text-muted-foreground">{age}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">EMG Activity:</dt>
            <dd className="text-muted-foreground">{emgActivity}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Range of Motion:</dt>
            <dd className="text-muted-foreground">{rangeOfMotion}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Motor Skill Exercises:</dt>
            <dd className="text-muted-foreground">{motorSkillExercises}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
