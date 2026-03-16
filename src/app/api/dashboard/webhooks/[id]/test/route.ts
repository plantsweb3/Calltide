import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEndpoints } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { deliverWebhook } from "@/lib/webhooks/dispatcher";
import { webhookDeliveries } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../../../demo-data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ error: "Demo mode" }, { status: 403 });
  }

  const rl = await rateLimit(`webhook-test:${businessId}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { id } = await params;

  // Verify ownership
  const [endpoint] = await db
    .select()
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

  // Create a test delivery
  const [delivery] = await db
    .insert(webhookDeliveries)
    .values({
      endpointId: endpoint.id,
      event: "call.completed",
      payload: {
        event: "call.completed",
        timestamp: new Date().toISOString(),
        data: {
          _test: true,
          callId: "test_call_" + Date.now(),
          callerPhone: "+15125550000",
          callerName: "Test Caller",
          duration: 120,
          outcome: "appointment_booked",
          sentiment: "positive",
          summary: "This is a test webhook delivery from Capta.",
        },
      },
      status: "pending",
      nextRetryAt: new Date().toISOString(),
    })
    .returning();

  // Attempt immediate delivery
  await deliverWebhook(delivery.id);

  // Check result
  const [result] = await db
    .select({ status: webhookDeliveries.status, httpStatus: webhookDeliveries.httpStatus, lastError: webhookDeliveries.lastError })
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, delivery.id))
    .limit(1);

  return NextResponse.json({
    deliveryId: delivery.id,
    status: result?.status || "pending",
    httpStatus: result?.httpStatus,
    error: result?.lastError,
  });
}
