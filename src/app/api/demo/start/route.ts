import { NextRequest, NextResponse } from "next/server";
import { fetchAccessToken } from "hume";
import { createHash } from "crypto";
import { db } from "@/db";
import { demoSessions } from "@/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { buildDemoSystemPrompt } from "@/lib/receptionist/demo-system-prompt";

const DAILY_CAP = 50;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.CRON_SECRET || "salt")).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 1 demo per IP per hour
  const hourlyRl = await rateLimit(`demo-hourly:${ip}`, RATE_LIMITS.demo);
  if (!hourlyRl.success) {
    return NextResponse.json(
      { error: "You can start one demo per hour. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((hourlyRl.resetAt - Date.now()) / 1000)) } },
    );
  }

  // Rate limit: 5 demos per IP per 24 hours
  const dailyRl = await rateLimit(`demo-daily:${ip}`, RATE_LIMITS.demoDaily);
  if (!dailyRl.success) {
    return NextResponse.json(
      { error: "You've reached the daily demo limit. Get Capta to talk to Maria anytime." },
      { status: 429 },
    );
  }

  // Global daily cap
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(demoSessions)
    .where(gte(demoSessions.startedAt, todayStart.toISOString()));

  if ((todayCount?.count ?? 0) >= DAILY_CAP) {
    return NextResponse.json(
      { error: "Maria's busy right now. Get Capta to talk to her anytime.", fallback: true },
      { status: 429 },
    );
  }

  // Check for concurrent session from same IP
  const ipHash = hashIp(ip);
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const [activeSession] = await db
    .select({ id: demoSessions.id })
    .from(demoSessions)
    .where(
      and(
        eq(demoSessions.ipHash, ipHash),
        gte(demoSessions.startedAt, oneHourAgo),
        sql`${demoSessions.endedAt} IS NULL`,
      ),
    )
    .limit(1);

  if (activeSession) {
    return NextResponse.json(
      { error: "You already have an active demo session." },
      { status: 409 },
    );
  }

  // Get Hume access token
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: "Voice system not configured" }, { status: 500 });
  }

  const accessToken = await fetchAccessToken({ apiKey, secretKey });
  if (!accessToken) {
    return NextResponse.json({ error: "Failed to initialize voice connection" }, { status: 500 });
  }

  // Create demo session record
  const [session] = await db.insert(demoSessions).values({
    ipHash,
    userAgent: req.headers.get("user-agent") || undefined,
  }).returning({ id: demoSessions.id });

  return NextResponse.json({
    sessionId: session.id,
    accessToken,
    configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
    systemPrompt: buildDemoSystemPrompt(),
    maxDuration: 300,
    greeting: "Hey there! I'm Maria. I'm the AI receptionist behind Capta — I answer calls for home service businesses in English and Spanish, 24 hours a day. I'd love to show you how I'd work for YOUR business specifically. Mind if I ask you a couple quick questions?",
  });
}
