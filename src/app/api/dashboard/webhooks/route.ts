import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { webhookEndpoints } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../demo-data";

const VALID_EVENTS = [
  "appointment.created",
  "appointment.cancelled",
  "appointment.rescheduled",
  "call.completed",
  "customer.created",
  "estimate.created",
  "message.taken",
] as const;

const createSchema = z.object({
  url: z.string().url().max(500),
  events: z.array(z.enum(VALID_EVENTS)).min(1).max(7),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json([]);
  }

  const endpoints = await db
    .select({
      id: webhookEndpoints.id,
      url: webhookEndpoints.url,
      events: webhookEndpoints.events,
      status: webhookEndpoints.status,
      failureCount: webhookEndpoints.failureCount,
      lastSuccessAt: webhookEndpoints.lastSuccessAt,
      lastFailureAt: webhookEndpoints.lastFailureAt,
      lastFailureReason: webhookEndpoints.lastFailureReason,
      createdAt: webhookEndpoints.createdAt,
    })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.businessId, businessId));

  return NextResponse.json(endpoints);
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ error: "Demo mode" }, { status: 403 });
  }

  const rl = await rateLimit(`webhook-create:${businessId}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  // Limit to 5 endpoints per business
  const existing = await db
    .select({ id: webhookEndpoints.id })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.businessId, businessId));

  if (existing.length >= 5) {
    return NextResponse.json({ error: "Maximum 5 webhook endpoints allowed" }, { status: 400 });
  }

  const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  const [endpoint] = await db
    .insert(webhookEndpoints)
    .values({
      businessId,
      url: result.data.url,
      events: result.data.events,
      secret,
    })
    .returning();

  return NextResponse.json({
    id: endpoint.id,
    url: endpoint.url,
    events: endpoint.events,
    status: endpoint.status,
    secret, // Shown once on creation
    createdAt: endpoint.createdAt,
  }, { status: 201 });
}
