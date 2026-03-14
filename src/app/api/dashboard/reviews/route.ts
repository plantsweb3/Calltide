import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { googleReviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

/**
 * GET /api/dashboard/reviews
 * List Google reviews for the business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-reviews:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const reviews = await db
    .select()
    .from(googleReviews)
    .where(eq(googleReviews.businessId, businessId))
    .orderBy(desc(googleReviews.createdAt))
    .limit(50);

  // Calculate stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const key = r.rating as keyof typeof ratingDistribution;
    if (key >= 1 && key <= 5) ratingDistribution[key]++;
  }

  return NextResponse.json({
    reviews,
    stats: {
      total: totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution: ratingDistribution,
    },
  });
}

const addReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  authorName: z.string().optional(),
  text: z.string().optional(),
  reviewId: z.string().optional(),
  publishedAt: z.string().optional(),
});

/**
 * POST /api/dashboard/reviews
 * Manually add a review (for import or manual tracking).
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-reviews-create:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();
  const parsed = addReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const [review] = await db.insert(googleReviews).values({
    businessId,
    rating: parsed.data.rating,
    authorName: parsed.data.authorName || null,
    text: parsed.data.text || null,
    reviewId: parsed.data.reviewId || null,
    publishedAt: parsed.data.publishedAt || new Date().toISOString(),
  }).returning();

  return NextResponse.json({ review });
}
