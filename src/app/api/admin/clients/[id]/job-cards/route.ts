import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobCards, pricingRanges, businesses, ownerResponses, customerNotifications, intakeAttachments } from "@/db/schema";
import { eq, desc, sql, and, gte, inArray } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
  const offset = Number(searchParams.get("offset") || "0");

  try {
    // Verify business exists
    const [biz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, id))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch job cards, count, pricing ranges, and response stats
    const [cards, [countRow], ranges, statusRows, [avgRow]] = await Promise.all([
      db
        .select()
        .from(jobCards)
        .where(eq(jobCards.businessId, id))
        .orderBy(desc(jobCards.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(jobCards)
        .where(eq(jobCards.businessId, id)),
      db
        .select()
        .from(pricingRanges)
        .where(
          and(
            eq(pricingRanges.businessId, id),
            eq(pricingRanges.active, true),
          ),
        )
        .orderBy(pricingRanges.sortOrder),
      db
        .select({
          status: jobCards.status,
          count: sql<number>`count(*)`,
        })
        .from(jobCards)
        .where(
          and(
            eq(jobCards.businessId, id),
            gte(jobCards.createdAt, thirtyDaysAgo),
          ),
        )
        .groupBy(jobCards.status),
      db
        .select({
          avgMinutes: sql<number>`avg((julianday(owner_responded_at) - julianday(created_at)) * 1440)`,
        })
        .from(jobCards)
        .where(
          and(
            eq(jobCards.businessId, id),
            gte(jobCards.createdAt, thirtyDaysAgo),
            sql`owner_responded_at IS NOT NULL`,
          ),
        ),
    ]);

    // Photo stats
    const [photoRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(intakeAttachments)
      .where(eq(intakeAttachments.businessId, id));
    const totalPhotos = photoRow?.total || 0;

    // Fetch responses/notifications for these cards
    const cardIds = cards.map((c) => c.id);
    let responses: (typeof ownerResponses.$inferSelect)[] = [];
    let notifications: (typeof customerNotifications.$inferSelect)[] = [];

    if (cardIds.length > 0) {
      [responses, notifications] = await Promise.all([
        db
          .select()
          .from(ownerResponses)
          .where(inArray(ownerResponses.jobCardId, cardIds))
          .orderBy(desc(ownerResponses.createdAt)),
        db
          .select()
          .from(customerNotifications)
          .where(inArray(customerNotifications.jobCardId, cardIds))
          .orderBy(desc(customerNotifications.sentAt)),
      ]);
    }

    // Group by card
    const responsesByCard = new Map<string, typeof responses>();
    for (const r of responses) {
      const arr = responsesByCard.get(r.jobCardId) || [];
      arr.push(r);
      responsesByCard.set(r.jobCardId, arr);
    }

    const notificationsByCard = new Map<string, typeof notifications>();
    for (const n of notifications) {
      const arr = notificationsByCard.get(n.jobCardId) || [];
      arr.push(n);
      notificationsByCard.set(n.jobCardId, arr);
    }

    const enrichedCards = cards.map((card) => ({
      ...card,
      responses: responsesByCard.get(card.id) || [],
      notifications: notificationsByCard.get(card.id) || [],
    }));

    // Build stats
    const statusCounts: Record<string, number> = {};
    let total30d = 0;
    for (const row of statusRows) {
      statusCounts[row.status || "unknown"] = row.count;
      total30d += row.count;
    }
    const responded = (statusCounts["confirmed"] || 0) +
      (statusCounts["adjusted"] || 0) +
      (statusCounts["site_visit_requested"] || 0);

    return NextResponse.json({
      cards: enrichedCards,
      total: countRow?.total || 0,
      pricingRanges: ranges,
      stats: {
        total30d,
        pending: statusCounts["pending_review"] || 0,
        confirmed: statusCounts["confirmed"] || 0,
        adjusted: statusCounts["adjusted"] || 0,
        expired: statusCounts["expired"] || 0,
        siteVisit: statusCounts["site_visit_requested"] || 0,
        responseRate: total30d > 0 ? Math.round((responded / total30d) * 100) : 0,
        avgResponseTimeMinutes: avgRow?.avgMinutes ? Math.round(avgRow.avgMinutes) : null,
        totalPhotos,
      },
      limit,
      offset,
    });
  } catch (error) {
    reportError("Failed to fetch job cards", error, { businessId: id });
    return NextResponse.json({ error: "Failed to fetch job cards" }, { status: 500 });
  }
}
