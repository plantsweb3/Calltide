import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { z } from "zod";

const VALID_STATUSES = ["confirmed", "cancelled", "completed", "no_show"] as const;

const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1).max(100)).min(1).max(50),
  status: z.enum(VALID_STATUSES),
});

/**
 * PUT /api/dashboard/appointments/bulk-status
 * Update the status of multiple appointments at once.
 * Max 50 per request, scoped by businessId.
 */
export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-appt-bulk:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bulkStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { ids, status } = parsed.data;

  try {
    // Verify all appointments belong to this business
    const existing = await db
      .select({ id: appointments.id, status: appointments.status })
      .from(appointments)
      .where(and(eq(appointments.businessId, businessId), inArray(appointments.id, ids)));

    const existingIds = new Set(existing.map((a) => a.id));
    const validIds = ids.filter((id) => existingIds.has(id));

    if (validIds.length === 0) {
      return NextResponse.json({ error: "No matching appointments found" }, { status: 404 });
    }

    // Update all matching appointments
    await db
      .update(appointments)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(and(eq(appointments.businessId, businessId), inArray(appointments.id, validIds)));

    return NextResponse.json({
      success: true,
      updated: validIds.length,
      total: ids.length,
    });
  } catch (err) {
    reportError("Failed to bulk update appointment statuses", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
