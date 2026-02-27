import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { incidents, incidentUpdates } from "@/db/schema";
import { desc, sql, eq, inArray } from "drizzle-orm";
import { addIncidentUpdate, formatDuration } from "@/lib/incidents/engine";

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
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

    let query = db.select().from(incidents).orderBy(desc(incidents.startedAt)).limit(limit).$dynamic();

    if (status) {
      query = query.where(eq(incidents.status, status));
    }
    if (severity) {
      query = query.where(eq(incidents.severity, severity));
    }

    const rows = await query;

    // Include updates for each incident
    const results = await Promise.all(
      rows.map(async (inc) => {
        const updates = await db
          .select()
          .from(incidentUpdates)
          .where(eq(incidentUpdates.incidentId, inc.id))
          .orderBy(desc(incidentUpdates.createdAt));
        return { ...inc, updates };
      }),
    );

    return NextResponse.json({ incidents: results });
  } catch (error) {
    console.error("Admin incidents GET error:", error);
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
    console.error("Admin incidents POST error:", error);
    return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
  }
}
