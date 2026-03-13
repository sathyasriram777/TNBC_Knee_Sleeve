import { prisma } from "@/lib/db";
import type { User } from "@supabase/supabase-js";

type UserType = "Clinician" | "Patient";

function userTypeFromMetadata(metadata: Record<string, unknown> | undefined): UserType {
  const t = metadata?.userType;
  return t === "Clinician" ? "Clinician" : "Patient";
}

/**
 * Creates or updates the app User row from the Supabase auth user.
 * Call this when an authenticated user loads a protected page so that
 * name and type from sign-up (user_metadata) are stored in our DB.
 */
export async function syncUserToDb(authUser: User): Promise<void> {
  const email = authUser.email;
  if (!email) return;

  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const name = (metadata?.name as string | undefined)?.trim() || null;
  const type = userTypeFromMetadata(metadata);

  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        email,
        name,
        type,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        id: authUser.id,
        email,
        name,
        type,
      },
    });
  }

  // When user is a patient, ensure they have one Patient record (for "my reports").
  if (type === "Patient") {
    const existingPatient = await prisma.patient.findFirst({
      where: { userId: authUser.id },
    });
    if (!existingPatient) {
      await prisma.patient.create({
        data: {
          userId: authUser.id,
          name: name?.trim() || "My record",
        },
      });
    }
  }
}
