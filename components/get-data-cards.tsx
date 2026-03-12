"use client";

import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GetDataCardProps = {
  patientId: string;
};

export function GetDataCard({ patientId }: GetDataCardProps) {
  const handleGetData = () => {
    // TODO: fetch data from ESP (e.g. HTTP endpoint or WebSocket)
    console.log("Get data from ESP for patient", patientId);
  };

  return (
    <Card className="border-0 bg-white w-full">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Get data from ESP
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <p className="text-muted-foreground text-sm mb-4">
          Fetch sensor data from your ESP device for this session.
        </p>
        <Button variant="secondary" size="default" onClick={handleGetData}>
          Get data from ESP
        </Button>
      </CardContent>
    </Card>
  );
}
