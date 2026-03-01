import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { clientFeedback } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const createSchema = z.object({
  type: z.enum(["feedback", "feature_request", "bug_report"]),
  category: z.enum(["general", "calls", "billing", "appointments", "sms", "other"]),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
});

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`feedback-list:${getClientIp(req)}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(clientFeedback)
    .where(eq(clientFeedback.businessId, businessId))
    .orderBy(desc(clientFeedback.createdAt))
    .limit(50);

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`feedback-create:${getClientIp(req)}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Max 50 active feedback items per business
  const [countResult] = await db
    .select({ count: db.$count(clientFeedback, eq(clientFeedback.businessId, businessId)) })
    .from(clientFeedback)
    .where(eq(clientFeedback.businessId, businessId));

  if ((countResult?.count ?? 0) >= 50) {
    return NextResponse.json({ error: "Maximum feedback limit reached (50)" }, { status: 400 });
  }

  const [created] = await db
    .insert(clientFeedback)
    .values({
      businessId,
      type: parsed.data.type,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .returning();

  return NextResponse.json({ item: created }, { status: 201 });
}
