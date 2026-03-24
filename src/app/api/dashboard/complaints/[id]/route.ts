import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { complaintTickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const updateComplaintSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  resolution: z.string().max(2000).optional(),
  category: z.enum(["service_quality", "billing", "scheduling", "communication", "other"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateComplaintSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = result.data;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (data.status) updates.status = data.status;
    if (data.severity) updates.severity = data.severity;
    if (data.resolution !== undefined) updates.resolution = data.resolution;
    if (data.category) updates.category = data.category;

    // Track resolution time
    if (data.status === "resolved" || data.status === "closed") {
      updates.resolvedAt = now;
    }

    await db
      .update(complaintTickets)
      .set(updates)
      .where(and(eq(complaintTickets.id, id), eq(complaintTickets.businessId, businessId)));

    const [updated] = await db
      .select()
      .from(complaintTickets)
      .where(and(eq(complaintTickets.id, id), eq(complaintTickets.businessId, businessId)))
      .limit(1);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    reportError("Failed to update complaint", error, { businessId });
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
