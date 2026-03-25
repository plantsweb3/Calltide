import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { webhookEndpoints, webhookDeliveries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const VALID_EVENTS = [
  "appointment.created",
  "appointment.cancelled",
  "appointment.rescheduled",
  "call.completed",
  "customer.created",
  "estimate.created",
  "message.taken",
] as const;

const updateSchema = z.object({
  url: z.string().url().max(500).optional(),
  events: z.array(z.enum(VALID_EVENTS)).min(1).max(7).optional(),
  status: z.enum(["active", "paused"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`webhooks-patch:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ error: "Demo mode" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  // Verify ownership
  const [endpoint] = await db
    .select({ id: webhookEndpoints.id })
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.id, id),
        eq(webhookEndpoints.businessId, businessId),
      ),
    )
    .limit(1);

  if (!endpoint) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (result.data.url) updates.url = result.data.url;
  if (result.data.events) updates.events = result.data.events;
  if (result.data.status) {
    updates.status = result.data.status;
    if (result.data.status === "active") updates.failureCount = 0;
  }

  const [updated] = await db
    .update(webhookEndpoints)
    .set(updates)
    .where(eq(webhookEndpoints.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    url: updated.url,
    events: updated.events,
    status: updated.status,
    failureCount: updated.failureCount,
    lastSuccessAt: updated.lastSuccessAt,
    lastFailureAt: updated.lastFailureAt,
    createdAt: updated.createdAt,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`webhooks-delete:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ error: "Demo mode" }, { status: 403 });
  }

  const { id } = await params;

  // Verify ownership
  const [endpoint] = await db
    .select({ id: webhookEndpoints.id })
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.id, id),
        eq(webhookEndpoints.businessId, businessId),
      ),
    )
    .limit(1);

  if (!endpoint) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete deliveries first, then endpoint
  await db.delete(webhookDeliveries).where(eq(webhookDeliveries.endpointId, id));
  await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));

  return NextResponse.json({ success: true });
}
