import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobCards, ownerResponses, customerNotifications } from "@/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../demo-data";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`job-cards-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ cards: [], total: 0, page: 1, totalPages: 0 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || "20")), 100);
  const status = searchParams.get("status"); // optional filter
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(jobCards.businessId, businessId)];
    if (status) {
      conditions.push(eq(jobCards.status, status));
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [cards, [countRow]] = await Promise.all([
      db
        .select()
        .from(jobCards)
        .where(whereClause)
        .orderBy(desc(jobCards.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(jobCards)
        .where(whereClause),
    ]);

    // Fetch response history for these cards
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

    // Group responses and notifications by card
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

    const total = countRow?.total || 0;
    return NextResponse.json({
      cards: enrichedCards,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    reportError("Failed to fetch job cards", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch job cards" }, { status: 500 });
  }
}
