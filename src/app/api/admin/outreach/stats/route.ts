import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, manualTouches } from "@/db/schema";
import { sql, eq, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Monday of this week
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset).toISOString();

  const [todayResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`${manualTouches.createdAt} >= ${todayStart}`);

  const [weekResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`${manualTouches.createdAt} >= ${weekStart}`);

  const byChannel = await db
    .select({ channel: manualTouches.channel, count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`${manualTouches.createdAt} >= ${weekStart}`)
    .groupBy(manualTouches.channel);

  const byOutcome = await db
    .select({ outcome: manualTouches.outcome, count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`${manualTouches.createdAt} >= ${weekStart}`)
    .groupBy(manualTouches.outcome);

  const [followUpsDue] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(
      sql`${prospects.outreachStatus} = 'follow_up' AND ${prospects.nextFollowUpAt} <= ${now.toISOString()}`
    );

  const [interested] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(eq(prospects.outreachStatus, "interested"));

  return NextResponse.json({
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    byChannel: byChannel.map((r) => ({ channel: r.channel, count: r.count })),
    byOutcome: byOutcome.map((r) => ({ outcome: r.outcome, count: r.count })),
    followUpsDue: followUpsDue?.count ?? 0,
    interested: interested?.count ?? 0,
  });
}
