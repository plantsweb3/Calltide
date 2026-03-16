import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, manualTouches } from "@/db/schema";
import { sql, eq, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Use YYYY-MM-DD prefix for SQLite string comparison (handles both "T" and " " separators)
  const todayPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Monday of this week
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
  const weekPrefix = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

  const [todayResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`substr(${manualTouches.createdAt}, 1, 10) >= ${todayPrefix}`);

  const [weekResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`substr(${manualTouches.createdAt}, 1, 10) >= ${weekPrefix}`);

  const byChannel = await db
    .select({ channel: manualTouches.channel, count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`substr(${manualTouches.createdAt}, 1, 10) >= ${weekPrefix}`)
    .groupBy(manualTouches.channel);

  const byOutcome = await db
    .select({ outcome: manualTouches.outcome, count: sql<number>`count(*)` })
    .from(manualTouches)
    .where(sql`substr(${manualTouches.createdAt}, 1, 10) >= ${weekPrefix}`)
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

  const [awaiting] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(eq(prospects.outreachStatus, "awaiting"));

  return NextResponse.json({
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    byChannel: byChannel.map((r) => ({ channel: r.channel, count: r.count })),
    byOutcome: byOutcome.map((r) => ({ outcome: r.outcome, count: r.count })),
    followUpsDue: followUpsDue?.count ?? 0,
    interested: interested?.count ?? 0,
    awaiting: awaiting?.count ?? 0,
  });
}
