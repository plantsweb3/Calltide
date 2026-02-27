import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/admin/blog (admin auth required)
 * List ALL blog posts (including drafts) for admin management.
 */
export async function GET() {
  const posts = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));

  // Map DB field names to what the admin UI expects
  const mapped = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    language: p.language,
    category: p.category,
    published: p.published,
    views: p.pageViews ?? 0,
    ctaClicks: p.auditCtaClicks ?? 0,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    body: p.body,
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    targetKeyword: p.targetKeyword ?? "",
    ogImageUrl: p.ogImage ?? "",
    pairedPostSlug: p.pairedPostId ?? null,
  }));

  return NextResponse.json(mapped);
}
