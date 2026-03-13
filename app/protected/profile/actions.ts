"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createPatient,
  deletePatient as deletePatientInDb,
  updateUserName,
  type PatientListItem,
} from "@/lib/queries/profile";
import { deleteSessionForUser } from "@/lib/queries/get-data";

export type AddPatientResult =
  | { success: true; patient: PatientListItem }
  | { success: false; error: string };

export type DeletePatientResult =
  | { success: true }
  | { success: false; error: string };

export async function addPatientAction(name: string): Promise<AddPatientResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in to add a patient." };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "Patient name is required." };
  }
  try {
    const patient = await createPatient(user.id, trimmed);
    return { success: true, patient };
  } catch (e) {
    console.error("addPatientAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to add patient.",
    };
  }
}

export async function deletePatientAction(
  patientId: string
): Promise<DeletePatientResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in to remove a patient." };
  }
  try {
    const deleted = await deletePatientInDb(patientId, user.id);
    if (!deleted) {
      return { success: false, error: "Patient not found or already removed." };
    }
    return { success: true };
  } catch (e) {
    console.error("deletePatientAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to remove patient.",
    };
  }
}

export type UpdateNameResult =
  | { success: true }
  | { success: false; error: string };

export async function updateUserNameAction(name: string): Promise<UpdateNameResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in to update your name." };
  }
  const trimmed = name.trim();
  try {
    const updated = await updateUserName(user.id, trimmed || "");
    if (!updated) {
      return { success: false, error: "Failed to update name." };
    }
    // Keep Supabase user_metadata in sync
    await supabase.auth.updateUser({ data: { name: trimmed || undefined } });
    return { success: true };
  } catch (e) {
    console.error("updateUserNameAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update name.",
    };
  }
}

export type DeleteReportResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteReportAction(
  sessionId: string
): Promise<DeleteReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in to delete a report." };
  }
  try {
    const deleted = await deleteSessionForUser(sessionId, user.id);
    if (!deleted) {
      return { success: false, error: "Report not found or already removed." };
    }
    return { success: true };
  } catch (e) {
    console.error("deleteReportAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete report.",
    };
  }
}
