import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { blogMarkdownToHtml } from "@/lib/blog-markdown";
import { reportError } from "@/lib/error-reporting";

/* ─── Content imports ─────────────────────────────────────────── */

import { COMPARISONS_A, COMPARISONS_A_PAIRS } from "@/content/blog/comparisons-a";
import { COMPARISONS_B, COMPARISONS_B_PAIRS } from "@/content/blog/comparisons-b";
import { TRADES_A, TRADES_A_PAIRS } from "@/content/blog/trades-a";
import { TRADES_B, TRADES_B_PAIRS } from "@/content/blog/trades-b";
import { BUYERS_GUIDES, BUYERS_GUIDES_PAIRS } from "@/content/blog/buyers-guides";
import { TRADE_PROBLEMS, TRADE_PROBLEMS_PAIRS } from "@/content/blog/trade-problems";
import { PROBLEM_AWARE, PROBLEM_AWARE_PAIRS } from "@/content/blog/problem-aware";
import { THOUGHT_LEADERSHIP, THOUGHT_LEADERSHIP_PAIRS } from "@/content/blog/thought-leadership";
import { CITY_LOCAL, CITY_LOCAL_PAIRS } from "@/content/blog/city-local";
import { ORIGINAL_POSTS, ORIGINAL_PAIRS } from "@/content/blog/original";

/* ─── Helpers ─────────────────────────────────────────────────── */

function verifySeedAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? req.nextUrl.searchParams.get("key") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!token || token.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

function readingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return Math.max(1, Math.ceil(text.split(" ").length / 200));
}

/* ─── Merged content ──────────────────────────────────────────── */

const POSTS = [
  ...ORIGINAL_POSTS,
  ...COMPARISONS_A,
  ...COMPARISONS_B,
  ...TRADES_A,
  ...TRADES_B,
  ...BUYERS_GUIDES,
  ...TRADE_PROBLEMS,
  ...PROBLEM_AWARE,
  ...THOUGHT_LEADERSHIP,
  ...CITY_LOCAL,
];

const PAIRS: [string, string][] = [
  ...ORIGINAL_PAIRS,
  ...COMPARISONS_A_PAIRS,
  ...COMPARISONS_B_PAIRS,
  ...TRADES_A_PAIRS,
  ...TRADES_B_PAIRS,
  ...BUYERS_GUIDES_PAIRS,
  ...TRADE_PROBLEMS_PAIRS,
  ...PROBLEM_AWARE_PAIRS,
  ...THOUGHT_LEADERSHIP_PAIRS,
  ...CITY_LOCAL_PAIRS,
];

/* ─── Seed endpoint ───────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  if (!verifySeedAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Clear paired references first (self-referential FK), then delete all posts
    await db.update(blogPosts).set({ pairedPostId: null });
    await db.delete(blogPosts);

    // Insert all posts
    const slugToId: Record<string, string> = {};

    for (const post of POSTS) {
      try {
        const html = blogMarkdownToHtml(post.markdown);
        const now = new Date().toISOString();

        const [inserted] = await db
          .insert(blogPosts)
          .values({
            title: post.title,
            slug: post.slug,
            body: html,
            authorName: post.authorName || "Capta",
            language: post.language,
            category: post.category,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            targetKeyword: post.targetKeyword,
            relatedPostSlugs: post.relatedPostSlugs,
            readingTimeMin: readingTime(html),
            published: true,
            publishedAt: now,
          })
          .returning();

        slugToId[post.slug] = inserted.id;
      } catch (err) {
        reportError(`Failed to seed post: ${post.slug}`, err);
        return NextResponse.json({ error: `Failed to seed: ${post.slug}` }, { status: 500 });
      }
    }

    // Link EN/ES pairs via pairedPostId
    for (const [enSlug, esSlug] of PAIRS) {
      const enId = slugToId[enSlug];
      const esId = slugToId[esSlug];
      if (enId && esId) {
        await db.update(blogPosts).set({ pairedPostId: esId }).where(eq(blogPosts.id, enId));
        await db.update(blogPosts).set({ pairedPostId: enId }).where(eq(blogPosts.id, esId));
      }
    }

    return NextResponse.json({
      success: true,
      seeded: POSTS.length,
      paired: PAIRS.length,
      slugs: Object.keys(slugToId),
    });
  } catch (err) {
    reportError("Blog seed error", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
