import { db } from "@/db";
import { webhookEndpoints, webhookDeliveries } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { buildWebhookPayload, type WebhookEvent } from "./payload-builder";
import crypto from "crypto";

/**
 * Dispatch a webhook event to all active endpoints for a business
 * that are subscribed to the given event type.
 */
export async function dispatchWebhook(
  businessId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.businessId, businessId),
          eq(webhookEndpoints.status, "active"),
        ),
      );

    const payload = buildWebhookPayload(event, data);

    for (const endpoint of endpoints) {
      const events = endpoint.events as string[];
      if (!events.includes(event)) continue;

      await db.insert(webhookDeliveries).values({
        endpointId: endpoint.id,
        event,
        payload: payload as unknown as Record<string, unknown>,
        status: "pending",
        nextRetryAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    reportError("Failed to dispatch webhook", err, { extra: { businessId, event } });
  }
}

/**
 * Sign a payload with HMAC-SHA256 using the endpoint's secret.
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Attempt to deliver a single webhook. Called by the retry queue.
 */
export async function deliverWebhook(deliveryId: string): Promise<void> {
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId))
    .limit(1);

  if (!delivery || delivery.status === "delivered") return;

  const [endpoint] = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, delivery.endpointId))
    .limit(1);

  if (!endpoint || endpoint.status !== "active") return;

  const body = JSON.stringify(delivery.payload);
  const signature = signPayload(body, endpoint.secret);
  const attempt = (delivery.attempts || 0) + 1;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Capta-Signature": signature,
        "X-Capta-Event": delivery.event,
        "X-Capta-Delivery": delivery.id,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      // Success
      await db
        .update(webhookDeliveries)
        .set({
          status: "delivered",
          httpStatus: response.status,
          attempts: attempt,
          deliveredAt: new Date().toISOString(),
        })
        .where(eq(webhookDeliveries.id, deliveryId));

      await db
        .update(webhookEndpoints)
        .set({
          failureCount: 0,
          lastSuccessAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(webhookEndpoints.id, endpoint.id));
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    const newFailureCount = (endpoint.failureCount || 0) + 1;

    if (attempt >= (delivery.maxAttempts || 5)) {
      // Max retries reached
      await db
        .update(webhookDeliveries)
        .set({
          status: "failed",
          attempts: attempt,
          lastError: errorMsg,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
    } else {
      // Schedule retry with exponential backoff: 30s, 2m, 8m, 32m
      const backoffSeconds = 30 * Math.pow(4, attempt - 1);
      const nextRetry = new Date(Date.now() + backoffSeconds * 1000).toISOString();

      await db
        .update(webhookDeliveries)
        .set({
          attempts: attempt,
          lastError: errorMsg,
          nextRetryAt: nextRetry,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
    }

    // Update endpoint failure tracking
    await db
      .update(webhookEndpoints)
      .set({
        failureCount: newFailureCount,
        lastFailureAt: new Date().toISOString(),
        lastFailureReason: errorMsg,
        // Auto-pause after 5 consecutive failures
        ...(newFailureCount >= 5 ? { status: "paused" } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(webhookEndpoints.id, endpoint.id));
  }
}

/**
 * Process all pending webhook deliveries that are due for retry.
 */
export async function processWebhookRetries(): Promise<{ processed: number; delivered: number; failed: number }> {
  const now = new Date().toISOString();

  const pending = await db
    .select({ id: webhookDeliveries.id })
    .from(webhookDeliveries)
    .where(
      and(
        eq(webhookDeliveries.status, "pending"),
        lte(webhookDeliveries.nextRetryAt, now),
      ),
    )
    .limit(50);

  let delivered = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      await deliverWebhook(row.id);
      // Check if it was delivered
      const [result] = await db
        .select({ status: webhookDeliveries.status })
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.id, row.id))
        .limit(1);
      if (result?.status === "delivered") delivered++;
      else if (result?.status === "failed") failed++;
    } catch (err) {
      failed++;
      reportError("Webhook delivery failed", err, { extra: { deliveryId: row.id } });
    }
  }

  return { processed: pending.length, delivered, failed };
}
