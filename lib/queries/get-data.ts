import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SessionWithPayloadCount = {
  id: string;
  patientId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  stoppedAt: Date | null;
  _count: { payloads: number };
};

export type SensorPayloadRow = {
  id: string;
  data: unknown;
  createdAt: Date;
  sessionId: string;
};

/**
 * Create a new recording session for a patient.
 * Caller must have already verified the patient belongs to the current user.
 */
export async function createSession(patientId: string) {
  const session = await prisma.session.create({
    data: { patientId, status: "recording" },
    select: { id: true, patientId: true, status: true, createdAt: true },
  });
  return session;
}

/**
 * Get the latest session for a patient (most recent by createdAt).
 * Caller must have verified patient ownership.
 */
export async function getLatestSessionForPatient(
  patientId: string
): Promise<SessionWithPayloadCount | null> {
  const session = await prisma.session.findFirst({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      patientId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      stoppedAt: true,
      _count: { select: { payloads: true } },
    },
  });
  return session;
}

/**
 * Get a session by ID only if it belongs to the given patient.
 * Used to verify ownership when fetching session details or payloads.
 */
export async function getSessionByIdForPatient(
  sessionId: string,
  patientId: string
) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, patientId },
    select: {
      id: true,
      patientId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      stoppedAt: true,
    },
  });
  return session;
}

/**
 * Get all payloads for a session, ordered by createdAt.
 * Caller must have verified the session belongs to a patient owned by the user.
 */
export async function getPayloadsBySessionId(sessionId: string) {
  const payloads = await prisma.sensorPayload.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, data: true, createdAt: true, sessionId: true },
  });
  return payloads;
}

/**
 * Stop a session. Only updates if the session belongs to the given patient.
 */
export async function stopSession(
  sessionId: string,
  patientId: string
): Promise<boolean> {
  const result = await prisma.session.updateMany({
    where: { id: sessionId, patientId },
    data: { status: "stopped", stoppedAt: new Date() },
  });
  return result.count > 0;
}

/**
 * Delete a session (report). Only deletes if the session's patient belongs to the given user.
 * Use for patient users deleting their own reports.
 */
export async function deleteSessionForUser(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.session.deleteMany({
    where: {
      id: sessionId,
      patient: { userId },
    },
  });
  return result.count > 0;
}

/**
 * Insert a sensor payload for a session.
 * Caller must have verified the session exists and is still recording.
 */
export async function createSensorPayload(
  sessionId: string,
  data: Prisma.InputJsonValue
) {
  const payload = await prisma.sensorPayload.create({
    data: { sessionId, data },
    select: { id: true, data: true, createdAt: true, sessionId: true },
  });
  return payload;
}
