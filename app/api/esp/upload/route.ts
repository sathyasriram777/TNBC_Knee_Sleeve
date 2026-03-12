import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { createSensorPayload } from "@/lib/queries/get-data";
import { NextResponse } from "next/server";

type EspUploadBody = {
  sessionId: string;
  samples?: unknown[];
  [key: string]: unknown;
};

export async function POST(request: Request) {
  let body: EspUploadBody;
  try {
    body = (await request.json()) as EspUploadBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { sessionId } = body;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { patient: { select: { userId: true } } },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "recording") {
    return NextResponse.json(
      { error: "Session is not recording" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.patient.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await createSensorPayload(sessionId, body as object);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("esp/upload", e);
    return NextResponse.json(
      { error: "Failed to store payload" },
      { status: 500 }
    );
  }
}
