"use client";

import { User } from "lucide-react";
import { useState } from "react";
import { updateUserNameAction } from "@/app/protected/profile/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileInfoProps = {
  initialName?: string | null;
  initialEmail?: string | null;
};

export function ProfileInfo({ initialName = null, initialEmail = null }: ProfileInfoProps) {
  const [name, setName] = useState(initialName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const email = initialEmail ?? "";

  const handleChangeName = async () => {
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    const result = await updateUserNameAction(name);
    setIsSaving(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError(result.error);
    }
  };

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
            <Button
              type="button"
              size="sm"
              onClick={handleChangeName}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Change Name"}
            </Button>
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your name"
                className="bg-background rounded-lg max-w-xs"
              />
            </div>
            {/* {email ? (
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <p id="profile-email" className="text-sm text-muted-foreground">
                  {email}
                </p>
              </div>
            ) : null} */}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Name updated.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
