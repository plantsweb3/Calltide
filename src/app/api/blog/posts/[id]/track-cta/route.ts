import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/blog/posts/[id]/track-cta (public)
 * Increment auditCtaClicks counter for a blog post.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = rateLimit(`blog-cta:${getClientIp(_req)}`, { limit: 30, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  await db
    .update(blogPosts)
    .set({ auditCtaClicks: sql`${blogPosts.auditCtaClicks} + 1` })
    .where(eq(blogPosts.id, id));

  return NextResponse.json({ success: true });
}
