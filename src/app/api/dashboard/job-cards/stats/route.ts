import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobCards } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const DEMO_BUSINESS_ID = "demo-business-id";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`job-cards-stats:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      total: 0,
      pending: 0,
      confirmed: 0,
      adjusted: 0,
      expired: 0,
      siteVisit: 0,
      responseRate: 0,
      avgResponseTimeMinutes: null,
    });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const rows = await db
      .select({
        status: jobCards.status,
        count: sql<number>`count(*)`,
      })
      .from(jobCards)
      .where(
        and(
          eq(jobCards.businessId, businessId),
          gte(jobCards.createdAt, thirtyDaysAgo),
        ),
      )
      .groupBy(jobCards.status);

    const statusCounts: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      statusCounts[row.status || "unknown"] = row.count;
      total += row.count;
    }

    const responded = (statusCounts["confirmed"] || 0) +
      (statusCounts["adjusted"] || 0) +
      (statusCounts["site_visit_requested"] || 0);

    // Average response time for responded cards
    const [avgRow] = await db
      .select({
        avgMinutes: sql<number>`avg((julianday(owner_responded_at) - julianday(created_at)) * 1440)`,
      })
      .from(jobCards)
      .where(
        and(
          eq(jobCards.businessId, businessId),
          gte(jobCards.createdAt, thirtyDaysAgo),
          sql`owner_responded_at IS NOT NULL`,
        ),
      );

    return NextResponse.json({
      total,
      pending: statusCounts["pending_review"] || 0,
      confirmed: statusCounts["confirmed"] || 0,
      adjusted: statusCounts["adjusted"] || 0,
      expired: statusCounts["expired"] || 0,
      siteVisit: statusCounts["site_visit_requested"] || 0,
      awaitingAdjustment: statusCounts["awaiting_adjustment"] || 0,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      avgResponseTimeMinutes: avgRow?.avgMinutes ? Math.round(avgRow.avgMinutes) : null,
    });
  } catch (error) {
    reportError("Failed to fetch job card stats", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
