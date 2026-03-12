import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmgDataCard() {
  return (
    <Card className="border-0 bg-white w-full">
      <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-4">
        <CardTitle className="text-foreground">EMG Data</CardTitle>
        <Button variant="secondary" size="sm">
          Insights
        </Button>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="w-full overflow-hidden rounded-lg border border-border bg-background">
          <Image
            src="/data.svg"
            alt="EMG data chart"
            width={600}
            height={280}
            className="h-auto w-full object-contain"
          />
        </div>
      </CardContent>
    </Card>
  );
}
