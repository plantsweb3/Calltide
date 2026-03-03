import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/blog/posts/[slug]/track-cta (public)
 * Increment auditCtaClicks counter for a blog post.
 * NOTE: The caller (audit-cta component) passes the post ID as the slug param.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = await rateLimit(`blog-cta:${getClientIp(_req)}`, { limit: 30, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  const { slug: id } = await params;

  await db
    .update(blogPosts)
    .set({ auditCtaClicks: sql`${blogPosts.auditCtaClicks} + 1` })
    .where(eq(blogPosts.id, id));

  return NextResponse.json({ success: true });
}
