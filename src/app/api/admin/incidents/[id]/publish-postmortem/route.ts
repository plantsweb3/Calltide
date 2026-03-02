import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incidents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyClients, notifySubscribers } from "@/lib/incidents/notifications";
import { reportError } from "@/lib/error-reporting";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const notifyAll = body?.notify !== false;

    const [incident] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!incident.postmortem) {
      return NextResponse.json({ error: "No postmortem to publish" }, { status: 400 });
    }

    // Skip if already published (prevents duplicate notifications)
    if (incident.postmortemPublished) {
      return NextResponse.json({ success: true, alreadyPublished: true });
    }

    await db
      .update(incidents)
      .set({
        postmortemPublished: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(incidents.id, id));

    if (notifyAll) {
      try {
        await notifyClients(incident, "resolved");
        await notifySubscribers(incident, "resolved");
      } catch (err) {
        reportError("Postmortem notification error", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Publish postmortem error", error);
    return NextResponse.json({ error: "Failed to publish postmortem" }, { status: 500 });
  }
}
