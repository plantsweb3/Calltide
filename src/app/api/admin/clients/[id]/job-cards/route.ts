import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobCards, pricingRanges, businesses } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
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

    // Fetch job cards with count
    const [cards, [countRow], ranges] = await Promise.all([
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
    ]);

    return NextResponse.json({
      cards,
      total: countRow?.total || 0,
      pricingRanges: ranges,
      limit,
      offset,
    });
  } catch (error) {
    reportError("Failed to fetch job cards", error, { businessId: id });
    return NextResponse.json({ error: "Failed to fetch job cards" }, { status: 500 });
  }
}
