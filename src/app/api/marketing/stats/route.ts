import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditRequests } from "@/db/schema";
import { sql, and, gte } from "drizzle-orm";

/**
 * GET /api/marketing/stats (admin auth required)
 * Returns audit funnel metrics for the marketing dashboard.
 */
export async function GET() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [todayCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditRequests)
    .where(gte(auditRequests.createdAt, startOfDay));

  const [weekCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditRequests)
    .where(gte(auditRequests.createdAt, startOfWeek));

  const [monthCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditRequests)
    .where(gte(auditRequests.createdAt, startOfMonth));

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditRequests);

  const [missedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditRequests)
    .where(
      and(
        sql`${auditRequests.auditCallStatus} IN ('missed', 'voicemail')`,
        sql`${auditRequests.auditCallStatus} IS NOT NULL`
      )
    );

  const [reportsSent] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditRequests)
    .where(sql`${auditRequests.reportSentAt} IS NOT NULL`);

  const [demosBooked] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditRequests)
    .where(sql`${auditRequests.demoBookedAt} IS NOT NULL`);

  const total = totalCount?.count ?? 0;
  const missed = missedCount?.count ?? 0;
  const reports = reportsSent?.count ?? 0;
  const demos = demosBooked?.count ?? 0;

  return NextResponse.json({
    today: todayCount?.count ?? 0,
    thisWeek: weekCount?.count ?? 0,
    thisMonth: monthCount?.count ?? 0,
    missRate: total > 0 ? Math.round((missed / total) * 1000) / 10 : 0,
    conversionRate: reports > 0 ? Math.round((demos / reports) * 1000) / 10 : 0,
    demosBooked: demos,
  });
}
