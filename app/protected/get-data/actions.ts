"use server";

import { createClient } from "@/lib/supabase/server";
import { getPatientByIdForUser } from "@/lib/queries/profile";
import {
  createSession,
  stopSession as stopSessionInDb,
} from "@/lib/queries/get-data";

export type StartGetDataResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export type StopGetDataResult =
  | { ok: true }
  | { ok: false; error: string };

export async function startGetDataAction(
  patientId: string
): Promise<StartGetDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to start a session." };
  }
  const patient = await getPatientByIdForUser(patientId, user.id);
  if (!patient) {
    return { ok: false, error: "Patient not found." };
  }
  try {
    const session = await createSession(patientId);
    return { ok: true, sessionId: session.id };
  } catch (e) {
    console.error("startGetDataAction", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to start session.",
    };
  }
}

export async function stopGetDataAction(
  sessionId: string,
  patientId: string
): Promise<StopGetDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to stop a session." };
  }
  const patient = await getPatientByIdForUser(patientId, user.id);
  if (!patient) {
    return { ok: false, error: "Patient not found." };
  }
  try {
    const stopped = await stopSessionInDb(sessionId, patientId);
    if (!stopped) {
      return { ok: false, error: "Session not found or already stopped." };
    }
    return { ok: true };
  } catch (e) {
    console.error("stopGetDataAction", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to stop session.",
    };
  }
}
