import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getPayloadsBySessionId } from "@/lib/queries/get-data";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
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

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { patient: { select: { userId: true } } },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.patient.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payloads = await getPayloadsBySessionId(sessionId);

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    payloads: payloads.map((p: { id: string; data: unknown; createdAt: Date }) => ({
      id: p.id,
      data: p.data,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
