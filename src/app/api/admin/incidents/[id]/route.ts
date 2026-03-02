import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { incidents, incidentUpdates, incidentNotifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { resolveIncident, addIncidentUpdate } from "@/lib/incidents/engine";
import { reportError } from "@/lib/error-reporting";

const patchSchema = z.object({
  status: z.enum(["detected", "investigating", "identified", "monitoring", "resolved", "postmortem"]).optional(),
  severity: z.enum(["critical", "major", "minor", "maintenance"]).optional(),
  title: z.string().optional(),
  titleEs: z.string().optional(),
  postmortem: z.string().optional(),
  postmortemEs: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const [incident] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates = await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, id))
      .orderBy(desc(incidentUpdates.createdAt));

    const notifications = await db
      .select()
      .from(incidentNotifications)
      .where(eq(incidentNotifications.incidentId, id))
      .orderBy(desc(incidentNotifications.sentAt));

    return NextResponse.json({ ...incident, updates, notifications });
  } catch (error) {
    reportError("Admin incident GET error", error);
    return NextResponse.json({ error: "Failed to fetch incident" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const data = parsed.data;

    if (data.status === "resolved") {
      await resolveIncident(id);
      return NextResponse.json({ success: true });
    }

    if (data.status) updates.status = data.status;
    if (data.severity) updates.severity = data.severity;
    if (data.title) updates.title = data.title;
    if (data.titleEs) updates.titleEs = data.titleEs;
    if (data.postmortem !== undefined) updates.postmortem = data.postmortem;
    if (data.postmortemEs !== undefined) updates.postmortemEs = data.postmortemEs;

    await db.update(incidents).set(updates).where(eq(incidents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Admin incident PATCH error", error);
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Delete related records first
    await db.delete(incidentNotifications).where(eq(incidentNotifications.incidentId, id));
    await db.delete(incidentUpdates).where(eq(incidentUpdates.incidentId, id));
    await db.delete(incidents).where(eq(incidents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Admin incident DELETE error", error);
    return NextResponse.json({ error: "Failed to delete incident" }, { status: 500 });
  }
}
