import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditRequests, prospects } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { scheduleAuditCall } from "@/lib/outreach/audit";
import { logActivity } from "@/lib/activity";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

const AUDIT_RATE_LIMIT = { limit: 5, windowSeconds: 3600 }; // 5 per IP per hour

const auditSchema = z.object({
  businessName: z.string().min(1).max(200),
  phone: z.string().regex(/^\+1\d{10}$/, "Valid US phone in E.164 format required"),
  email: z.string().email().max(200),
  businessType: z.enum(["plumber", "hvac", "electrician", "landscaper", "general_contractor", "other"]),
  language: z.enum(["en", "es"]).default("en"),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(200).optional(),
});

/**
 * GET /api/audit/request?count=true
 * Returns audit request count for social proof.
 */
export async function GET(req: NextRequest) {
  const wantCount = req.nextUrl.searchParams.get("count");
  if (wantCount) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditRequests);
    return NextResponse.json({ count: Math.max(result?.count ?? 0, 500) }); // min 500 for social proof
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

/**
 * POST /api/audit/request
 * Public — rate limited, no auth.
 */
export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIp(req);
  const rl = await rateLimit(`audit-request:${ip}`, AUDIT_RATE_LIMIT);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = auditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { businessName, phone, email, businessType, language, utmSource, utmMedium, utmCampaign } = parsed.data;

  // Check for duplicate within 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [existing] = await db
    .select({ id: auditRequests.id })
    .from(auditRequests)
    .where(
      and(
        eq(auditRequests.phone, phone),
        gte(auditRequests.createdAt, oneDayAgo),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "This number was already audited in the last 24 hours. Check your email for the report." },
      { status: 409 },
    );
  }

  // Create or find prospect
  let prospectId: string | undefined;
  const [existingProspect] = await db
    .select({ id: prospects.id })
    .from(prospects)
    .where(eq(prospects.phone, phone))
    .limit(1);

  if (existingProspect) {
    prospectId = existingProspect.id;
    await db.update(prospects).set({
      email: email,
      businessName: businessName,
      vertical: businessType === "other" ? undefined : businessType,
      source: "audit_page",
      updatedAt: new Date().toISOString(),
    }).where(eq(prospects.id, prospectId));
  } else {
    const [newProspect] = await db.insert(prospects).values({
      businessName,
      phone,
      email,
      vertical: businessType === "other" ? undefined : businessType,
      source: "audit_page",
      language,
      status: "new",
    }).returning();
    prospectId = newProspect.id;
  }

  // Determine call timing
  const now = new Date();
  const ct = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const hour = ct.getHours();
  const day = ct.getDay();
  const isBusinessHours = day >= 1 && day <= 5 && hour >= 9 && hour < 17;

  let estimatedCallTime: string;

  // Create audit request record
  const [auditReq] = await db.insert(auditRequests).values({
    businessName,
    phone,
    email,
    businessType,
    language,
    prospectId,
    auditCallStatus: "scheduled",
    utmSource,
    utmMedium,
    utmCampaign,
  }).returning();

  if (isBusinessHours) {
    // Schedule call for 10-30 minutes from now
    const delayMinutes = Math.floor(Math.random() * 21) + 10;
    estimatedCallTime = `~${delayMinutes} minutes`;

    // Fire the audit call via existing system (fire-and-forget)
    scheduleAuditCall(prospectId).then(async (result) => {
      if (result.success && result.callId) {
        // Link the audit call to the request
        await db.update(auditRequests).set({
          auditCallSid: result.callId,
          auditCallStatus: "calling",
        }).where(eq(auditRequests.id, auditReq.id));
      }
    }).catch((err) => reportError("Failed to schedule audit call", err));
  } else {
    estimatedCallTime = "next business day between 10am-3pm CT";
  }

  await logActivity({
    type: "audit_request",
    entityType: "prospect",
    entityId: prospectId,
    title: `Audit request: ${businessName}`,
    detail: `Phone: ${phone}, Type: ${businessType}, ETA: ${estimatedCallTime}`,
  });

  return NextResponse.json({
    id: auditReq.id,
    estimatedCallTime,
    businessName,
    phone,
    email,
    language,
  });
}
