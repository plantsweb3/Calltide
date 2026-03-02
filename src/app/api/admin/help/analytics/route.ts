import { NextResponse } from "next/server";
import { db } from "@/db";
import { helpArticles, helpSearchMisses } from "@/db/schema";
import { sql, desc, eq, gt, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/admin/help/analytics
 * Return knowledge base analytics data.
 */
export async function GET() {
  try {
    // Top 10 articles by viewCount
    const topArticles = await db
      .select({
        id: helpArticles.id,
        title: helpArticles.title,
        viewCount: helpArticles.viewCount,
        helpfulYes: helpArticles.helpfulYes,
        helpfulNo: helpArticles.helpfulNo,
      })
      .from(helpArticles)
      .orderBy(desc(helpArticles.viewCount))
      .limit(10);

    // Articles where helpfulNo > 0 and helpful rate < 60%
    const lowHelpful = await db
      .select({
        id: helpArticles.id,
        title: helpArticles.title,
        viewCount: helpArticles.viewCount,
        helpfulYes: helpArticles.helpfulYes,
        helpfulNo: helpArticles.helpfulNo,
      })
      .from(helpArticles)
      .where(
        and(
          gt(helpArticles.helpfulNo, 0),
          sql`CAST(${helpArticles.helpfulYes} AS REAL) / (${helpArticles.helpfulYes} + ${helpArticles.helpfulNo}) < 0.6`,
        ),
      );

    // Search misses in the last 30 days, grouped by query, sorted by frequency
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const searchMisses = await db
      .select({
        query: helpSearchMisses.query,
        count: sql<number>`count(*)`,
        lastSeen: sql<string>`max(${helpSearchMisses.createdAt})`,
      })
      .from(helpSearchMisses)
      .where(sql`${helpSearchMisses.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(helpSearchMisses.query)
      .orderBy(sql`count(*) DESC`);

    // Total views across all articles
    const [viewsResult] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${helpArticles.viewCount}), 0)`,
      })
      .from(helpArticles);

    // Total published articles
    const [countResult] = await db
      .select({
        totalArticles: sql<number>`count(*)`,
      })
      .from(helpArticles)
      .where(eq(helpArticles.status, "published"));

    // Overall helpful rate
    const [helpfulResult] = await db
      .select({
        totalYes: sql<number>`COALESCE(SUM(${helpArticles.helpfulYes}), 0)`,
        totalNo: sql<number>`COALESCE(SUM(${helpArticles.helpfulNo}), 0)`,
      })
      .from(helpArticles);

    const totalYes = helpfulResult.totalYes ?? 0;
    const totalNo = helpfulResult.totalNo ?? 0;
    const totalVotes = totalYes + totalNo;
    const avgHelpfulRate = totalVotes > 0 ? Math.round((totalYes / totalVotes) * 100) : 0;

    return NextResponse.json({
      topArticles,
      lowHelpful,
      searchMisses,
      totalViews: viewsResult.totalViews ?? 0,
      totalArticles: countResult.totalArticles ?? 0,
      avgHelpfulRate,
    });
  } catch (error) {
    reportError("Error fetching help analytics", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
