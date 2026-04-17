import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { googleReviews, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAnthropic, isAnthropicConfigured, HAIKU_MODEL } from "@/lib/ai/client";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { z } from "zod";

/**
 * POST /api/dashboard/reviews/[id]/draft
 * Generate an AI-drafted reply for a Google review using Claude Haiku.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`review-draft:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  // Fetch the review
  const [review] = await db
    .select()
    .from(googleReviews)
    .where(and(eq(googleReviews.id, id), eq(googleReviews.businessId, businessId)))
    .limit(1);

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Fetch business info for context
  const [biz] = await db
    .select({ name: businesses.name, receptionistName: businesses.receptionistName })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const receptionistName = biz?.receptionistName || "Maria";
  const businessName = biz?.name || "the business";

  if (!isAnthropicConfigured()) {
    return NextResponse.json({ error: "AI drafting is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  try {
    const anthropic = getAnthropic();

    const prompt = `You are ${receptionistName} replying on behalf of ${businessName} to a Google review.

Review: ${review.rating} star${review.rating !== 1 ? "s" : ""}${review.authorName ? ` from ${review.authorName}` : ""}
${review.text ? `"${review.text}"` : "(No text provided)"}

Write a warm, professional reply (2-3 sentences).
If the review is positive (4-5 stars): thank them specifically for what they mentioned.
If the review is negative (1-2 stars): sincerely apologize, acknowledge their concern, and offer to make it right.
If the review is neutral (3 stars): thank them for the feedback and mention your commitment to improvement.

Do NOT include a greeting like "Dear" or a sign-off like "Best regards". Just the reply text.`;

    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const draft = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    if (!draft) {
      return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
    }

    // Save draft to DB
    await db
      .update(googleReviews)
      .set({ replyDraft: draft, replyStatus: "drafted" })
      .where(eq(googleReviews.id, id));

    return NextResponse.json({ draft, replyStatus: "drafted" });
  } catch (error) {
    reportError("Review draft generation failed", error as Error, { businessId, extra: { reviewId: id } });
    return NextResponse.json({ error: "Failed to generate reply draft" }, { status: 500 });
  }
}

const updateSchema = z.object({
  action: z.enum(["approve", "edit"]),
  reply: z.string().max(2000).optional(),
});

/**
 * PUT /api/dashboard/reviews/[id]/draft
 * Approve or edit a drafted review reply.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`review-draft-update:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  // Verify review belongs to this business
  const [review] = await db
    .select()
    .from(googleReviews)
    .where(and(eq(googleReviews.id, id), eq(googleReviews.businessId, businessId)))
    .limit(1);

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (parsed.data.action === "approve") {
    await db
      .update(googleReviews)
      .set({ replyStatus: "approved" })
      .where(eq(googleReviews.id, id));
    return NextResponse.json({ replyStatus: "approved" });
  }

  // Edit action — update the draft text
  if (!parsed.data.reply) {
    return NextResponse.json({ error: "Reply text required for edit action" }, { status: 400 });
  }

  await db
    .update(googleReviews)
    .set({ replyDraft: parsed.data.reply, replyStatus: "drafted" })
    .where(eq(googleReviews.id, id));

  return NextResponse.json({ draft: parsed.data.reply, replyStatus: "drafted" });
}
