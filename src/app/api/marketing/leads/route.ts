import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketingLeads } from "@/db/schema";
import { z } from "zod";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const leadSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(100).optional(),
  trade: z.string().max(50).optional(),
  source: z.enum(["calculator", "guide", "newsletter"]).default("calculator"),
  estimatedMonthlyLoss: z.number().int().positive().optional(),
  avgJobValue: z.number().int().positive().optional(),
  missedCallsPerWeek: z.number().int().min(0).optional(),
  language: z.enum(["en", "es"]).default("en"),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`marketing-lead:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;

  await db.insert(marketingLeads).values({
    email: data.email,
    name: data.name ?? null,
    trade: data.trade ?? null,
    source: data.source,
    estimatedMonthlyLoss: data.estimatedMonthlyLoss ?? null,
    avgJobValue: data.avgJobValue ?? null,
    missedCallsPerWeek: data.missedCallsPerWeek ?? null,
    language: data.language,
    utmSource: data.utmSource ?? null,
    utmMedium: data.utmMedium ?? null,
    utmCampaign: data.utmCampaign ?? null,
  });

  return NextResponse.json({ ok: true });
}
