"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createPatient,
  deletePatient as deletePatientInDb,
  type PatientListItem,
} from "@/lib/queries/profile";

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
