import { NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyDigests, businesses } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET() {
  try {
    // Get recent digests with business names
    const digests = await db
      .select({
        id: weeklyDigests.id,
        businessId: weeklyDigests.businessId,
        businessName: businesses.name,
        receptionistName: businesses.receptionistName,
        weekStartDate: weeklyDigests.weekStartDate,
        weekEndDate: weeklyDigests.weekEndDate,
        stats: weeklyDigests.stats,
        emailSentAt: weeklyDigests.emailSentAt,
        smsSentAt: weeklyDigests.smsSentAt,
        createdAt: weeklyDigests.createdAt,
      })
      .from(weeklyDigests)
      .leftJoin(businesses, eq(weeklyDigests.businessId, businesses.id))
      .orderBy(desc(weeklyDigests.createdAt))
      .limit(200);

    // Summary stats
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(weeklyDigests);

    const [lastWeekResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(weeklyDigests)
      .where(sql`${weeklyDigests.createdAt} > datetime('now', '-7 days')`);

    // Count businesses with digest enabled
    const [enabledResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(businesses)
      .where(
        sql`${businesses.active} = 1 AND COALESCE(${businesses.enableWeeklyDigest}, 1) = 1`,
      );

    return NextResponse.json({
      digests,
      stats: {
        totalSent: totalResult?.count ?? 0,
        sentLastWeek: lastWeekResult?.count ?? 0,
        enabledClients: enabledResult?.count ?? 0,
      },
    });
  } catch (err) {
    reportError("[admin digests] Error", err);
    return NextResponse.json({ error: "Failed to load digests" }, { status: 500 });
  }
}
