import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db";
import { demoSessions } from "@/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { buildDemoSystemPrompt } from "@/lib/receptionist/demo-system-prompt";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";

const DAILY_CAP = 50;
const DEMO_AGENT_ID = process.env.ELEVENLABS_DEMO_AGENT_ID;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.CRON_SECRET || "salt")).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 5 demos per IP per 15 minutes
  const hourlyRl = await rateLimit(`demo-v2:${ip}`, RATE_LIMITS.demo);
  if (!hourlyRl.success) {
    return NextResponse.json(
      { error: "Too many demos. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((hourlyRl.resetAt - Date.now()) / 1000)) } },
    );
  }

  // Rate limit: 30 demos per IP per 24 hours
  const dailyRl = await rateLimit(`demo-daily-v2:${ip}`, RATE_LIMITS.demoDaily);
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

  // Auto-expire any stale sessions from same IP (no blocking — just clean up)
  const ipHash = hashIp(ip);
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  await db
    .update(demoSessions)
    .set({ endedAt: new Date().toISOString() })
    .where(
      and(
        eq(demoSessions.ipHash, ipHash),
        gte(demoSessions.startedAt, oneHourAgo),
        sql`${demoSessions.endedAt} IS NULL`,
      ),
    );

  // Get ElevenLabs signed URL
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !DEMO_AGENT_ID) {
    return NextResponse.json({ error: "Voice system not configured" }, { status: 500 });
  }

  let signedUrl: string;
  try {
    const client = getElevenLabsClient();
    const response = await client.conversationalAi.getSignedUrl({
      agent_id: DEMO_AGENT_ID,
    });
    signedUrl = response.signed_url;
  } catch {
    return NextResponse.json({ error: "Failed to initialize voice connection" }, { status: 500 });
  }

  // Create demo session record
  const [session] = await db.insert(demoSessions).values({
    ipHash,
    userAgent: req.headers.get("user-agent") || undefined,
  }).returning({ id: demoSessions.id });

  return NextResponse.json({
    sessionId: session.id,
    signedUrl,
    maxDuration: 300,
    greeting: "Hey there! I'm Maria. I'm the AI receptionist behind Capta — I answer calls for home service businesses in English and Spanish, 24 hours a day. I'd love to show you how I'd work for YOUR business specifically. Mind if I ask you a couple quick questions?",
  });
}
