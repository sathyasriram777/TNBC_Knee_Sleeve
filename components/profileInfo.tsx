"use client";

import { User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileInfoProps = {
  initialName?: string | null;
};

export function ProfileInfo({ initialName = null }: ProfileInfoProps) {
  const [name, setName] = useState(initialName ?? "");

  return (
    <Card className="bg-muted w-full">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="flex flex-wrap items-start gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background">
              <User className="h-14 w-14 text-muted-foreground" />
            </div>
            <Button type="button" size="sm">
              Add Photo
            </Button>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-background rounded-lg max-w-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
