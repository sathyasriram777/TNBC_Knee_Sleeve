"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountSettingsProps = {
  initialEmail?: string | null;
};

export function AccountSettings({ initialEmail = null }: AccountSettingsProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Card className="bg-muted w-full">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="email" className="w-20 shrink-0 text-foreground">
            Email:
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="existingEmail@mail.mcgill.ca"
            className="flex-1 min-w-0 bg-white rounded-lg"
          />
          <Button type="button" size="sm" className="shrink-0">
            Save
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="password" className="w-20 shrink-0 text-foreground">
            Password:
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="flex-1 min-w-0 bg-white rounded-lg"
          />
          <Button type="button" size="sm" className="shrink-0" asChild>
            <Link href="/auth/update-password">Change Password</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => {}}
          >
            Delete Account
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={signOut}
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
