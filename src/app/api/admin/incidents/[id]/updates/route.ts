import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { incidents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addIncidentUpdate } from "@/lib/incidents/engine";
import { notifyOwner, notifyClients, notifySubscribers } from "@/lib/incidents/notifications";

const updateSchema = z.object({
  status: z.string().min(1),
  message: z.string().min(1),
  messageEs: z.string().optional(),
  isPublic: z.boolean().default(true),
  notify: z.boolean().default(true),
});

export async function POST(
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { status, message, messageEs, isPublic, notify } = parsed.data;

    // Update incident status
    await db
      .update(incidents)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(incidents.id, id));

    // Add timeline entry
    await addIncidentUpdate(id, status, { message, messageEs, isPublic });

    // Send notifications if requested
    if (notify) {
      const [incident] = await db
        .select()
        .from(incidents)
        .where(eq(incidents.id, id))
        .limit(1);

      if (incident) {
        try {
          await notifyOwner(incident, "update");
          if (incident.severity === "critical" || incident.severity === "major") {
            await notifyClients(incident, "update");
          }
          await notifySubscribers(incident, "update");
        } catch (err) {
          console.error("Update notification error:", err);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Admin incident update POST error:", error);
    return NextResponse.json({ error: "Failed to add update" }, { status: 500 });
  }
}
