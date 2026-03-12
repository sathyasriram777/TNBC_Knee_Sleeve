import { prisma } from "@/lib/db";

/** Profile data for the current user (name, email) - used by ProfileInfo and AccountSettings */
export type Profile = {
  id: string;
  name: string | null;
  email: string;
};

/** Minimal patient for list display - used by Patients component */
export type PatientListItem = {
  id: string;
  name: string;
};

/**
 * Get profile (name, email) for a user by their ID.
 * Use this for the profile page when you have the authenticated user's ID (e.g. from Supabase auth or your User table).
 */
export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Get profile by email (e.g. when you only have the auth user's email from Supabase).
 */
export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Get all patients for a user (for the profile page Patients list).
 */
export async function getPatientsByUserId(userId: string): Promise<PatientListItem[]> {
  const patients = await prisma.patient.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  return patients;
}

/**
 * Get a single patient by ID only if they belong to the given user.
 */
export async function getPatientByIdForUser(
  patientId: string,
  userId: string
): Promise<PatientListItem | null> {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true, name: true },
  });
  return patient;
}

/**
 * Update the current user's display name.
 */
export async function updateUserName(userId: string, name: string): Promise<Profile | null> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() || null },
    select: { id: true, name: true, email: true },
  });
  return { id: user.id, name: user.name, email: user.email };
}

/**
 * Update the current user's email.
 * Note: if you use Supabase Auth, you may need to update email there as well and keep this in sync.
 */
export async function updateUserEmail(userId: string, email: string): Promise<Profile | null> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { email: email.trim() },
    select: { id: true, name: true, email: true },
  });
  return { id: user.id, name: user.name, email: user.email };
}

/**
 * Create a new patient for a user.
 */
export async function createPatient(userId: string, name: string): Promise<PatientListItem> {
  const patient = await prisma.patient.create({
    data: { userId, name: name.trim() },
    select: { id: true, name: true },
  });
  return patient;
}

/**
 * Delete a patient by ID. Only deletes if the patient belongs to the given user.
 */
export async function deletePatient(patientId: string, userId: string): Promise<boolean> {
  const result = await prisma.patient.deleteMany({
    where: { id: patientId, userId },
  });
  return result.count > 0;
}

async function testProfileQueries() {
  console.log("Testing profile queries...");
  const profile = await getProfileByUserId("7dd47104-c16f-4235-bbd1-792ae80c6066");
  console.log(profile);
}
await testProfileQueries();