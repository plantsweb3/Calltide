import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { incidents, incidentUpdates } from "@/db/schema";
import { desc, sql, eq, inArray } from "drizzle-orm";
import { addIncidentUpdate, formatDuration } from "@/lib/incidents/engine";
import { reportError } from "@/lib/error-reporting";

const createSchema = z.object({
  title: z.string().min(1),
  titleEs: z.string().optional(),
  severity: z.enum(["critical", "major", "minor", "maintenance"]),
  affectedServices: z.array(z.string()).min(1),
  message: z.string().min(1),
  messageEs: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const severity = req.nextUrl.searchParams.get("severity");
    const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "50") || 50), 100);

    let query = db.select().from(incidents).orderBy(desc(incidents.startedAt)).limit(limit).$dynamic();

    if (status) {
      query = query.where(eq(incidents.status, status));
    }
    if (severity) {
      query = query.where(eq(incidents.severity, severity));
    }

    const rows = await query;

    // Batch fetch all updates for returned incidents (avoids N+1)
    const incidentIds = rows.map((r) => r.id);
    const allUpdates = incidentIds.length > 0
      ? await db
          .select()
          .from(incidentUpdates)
          .where(inArray(incidentUpdates.incidentId, incidentIds))
          .orderBy(desc(incidentUpdates.createdAt))
      : [];

    const updatesByIncident = new Map<string, typeof allUpdates>();
    for (const update of allUpdates) {
      const list = updatesByIncident.get(update.incidentId) || [];
      list.push(update);
      updatesByIncident.set(update.incidentId, list);
    }

    const results = rows.map((inc) => ({
      ...inc,
      updates: updatesByIncident.get(inc.id) || [],
    }));

    return NextResponse.json({ incidents: results });
  } catch (error) {
    reportError("Admin incidents GET error", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, titleEs, severity, affectedServices, message, messageEs } = parsed.data;
    const status = severity === "maintenance" ? "monitoring" : "investigating";

    const [incident] = await db
      .insert(incidents)
      .values({
        title,
        titleEs,
        status,
        severity,
        affectedServices,
        createdBy: "admin",
      })
      .returning();

    await addIncidentUpdate(incident.id, status, {
      message,
      messageEs,
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    reportError("Admin incidents POST error", error);
    return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
  }
}
