import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoSessions } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  // Require admin cookie
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Total demos
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(demoSessions);
  const totalDemos = totalResult?.count ?? 0;

  // Today's demos
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(demoSessions)
    .where(sql`${demoSessions.startedAt} >= ${todayStart.toISOString()}`);
  const todayDemos = todayResult?.count ?? 0;

  // Average duration
  const [avgDurResult] = await db
    .select({ avg: sql<number>`coalesce(avg(${demoSessions.durationSeconds}), 0)` })
    .from(demoSessions)
    .where(sql`${demoSessions.durationSeconds} IS NOT NULL`);
  const avgDuration = avgDurResult?.avg ?? 0;

  // Conversion rate
  const [convertedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(demoSessions)
    .where(sql`${demoSessions.convertedToSignup} = 1`);
  const converted = convertedResult?.count ?? 0;
  const conversionRate = totalDemos > 0 ? Math.round((converted / totalDemos) * 100 * 10) / 10 : 0;

  // Phase funnel
  const [roiCount] = await db.select({ count: sql<number>`count(*)` }).from(demoSessions).where(sql`${demoSessions.reachedROI} = 1`);
  const [roleplayCount] = await db.select({ count: sql<number>`count(*)` }).from(demoSessions).where(sql`${demoSessions.reachedRoleplay} = 1`);
  const [closeCount] = await db.select({ count: sql<number>`count(*)` }).from(demoSessions).where(sql`${demoSessions.reachedClose} = 1`);

  // Top trades
  const topTrades = await db
    .select({ trade: demoSessions.businessType, count: sql<number>`count(*)` })
    .from(demoSessions)
    .where(sql`${demoSessions.businessType} IS NOT NULL`)
    .groupBy(demoSessions.businessType)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Top pain points
  const topPainPoints = await db
    .select({ pain: demoSessions.painPoint, count: sql<number>`count(*)` })
    .from(demoSessions)
    .where(sql`${demoSessions.painPoint} IS NOT NULL`)
    .groupBy(demoSessions.painPoint)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Average estimated monthly loss
  const [avgLossResult] = await db
    .select({ avg: sql<number>`coalesce(avg(${demoSessions.estimatedMonthlyLoss}), 0)` })
    .from(demoSessions)
    .where(sql`${demoSessions.estimatedMonthlyLoss} IS NOT NULL`);
  const avgMonthlyLoss = Math.round(avgLossResult?.avg ?? 0);

  // Language breakdown
  const languageBreakdown = await db
    .select({ language: demoSessions.language, count: sql<number>`count(*)` })
    .from(demoSessions)
    .groupBy(demoSessions.language)
    .orderBy(sql`count(*) desc`);

  // Business size breakdown
  const businessSizes = await db
    .select({ size: demoSessions.businessSize, count: sql<number>`count(*)` })
    .from(demoSessions)
    .where(sql`${demoSessions.businessSize} IS NOT NULL`)
    .groupBy(demoSessions.businessSize)
    .orderBy(sql`count(*) desc`);

  // Recent demos
  const recentDemos = await db
    .select()
    .from(demoSessions)
    .orderBy(desc(demoSessions.startedAt))
    .limit(50);

  return NextResponse.json({
    totalDemos,
    todayDemos,
    avgDuration,
    conversionRate,
    phaseFunnel: {
      started: totalDemos,
      reachedROI: roiCount?.count ?? 0,
      reachedRoleplay: roleplayCount?.count ?? 0,
      reachedClose: closeCount?.count ?? 0,
      converted,
    },
    topTrades: topTrades.map((t) => ({ trade: t.trade ?? "unknown", count: t.count })),
    topPainPoints: topPainPoints.map((p) => ({ pain: p.pain ?? "unknown", count: p.count })),
    avgMonthlyLoss,
    languageBreakdown: languageBreakdown.map((l) => ({ language: l.language ?? "en", count: l.count })),
    businessSizes: businessSizes.map((s) => ({ size: s.size ?? "unknown", count: s.count })),
    recentDemos: recentDemos.map((d) => ({
      id: d.id,
      startedAt: d.startedAt,
      durationSeconds: d.durationSeconds,
      businessType: d.businessType,
      businessName: d.businessName,
      businessSize: d.businessSize,
      reachedROI: d.reachedROI ?? false,
      reachedRoleplay: d.reachedRoleplay ?? false,
      reachedClose: d.reachedClose ?? false,
      convertedToSignup: d.convertedToSignup ?? false,
      language: d.language,
      estimatedMonthlyLoss: d.estimatedMonthlyLoss,
    })),
  });
}
