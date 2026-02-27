import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * GET /api/blog/posts (public)
 * Query published blog posts with filters.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const language = params.get("language") ?? "en";
  const category = params.get("category");
  const limit = Math.min(parseInt(params.get("limit") ?? "10", 10), 50);
  const offset = Math.max(parseInt(params.get("offset") ?? "0", 10), 0);
  const slug = params.get("slug");

  // Single post by slug
  if (slug) {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Increment page view
    db.update(blogPosts)
      .set({ pageViews: (post.pageViews ?? 0) + 1 })
      .where(eq(blogPosts.id, post.id))
      .catch(() => {});

    return NextResponse.json(post);
  }

  const conditions = [eq(blogPosts.published, true), eq(blogPosts.language, language)];
  if (category) conditions.push(eq(blogPosts.category, category));

  const posts = await db
    .select()
    .from(blogPosts)
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(and(...conditions));

  return NextResponse.json({
    posts,
    total: countResult?.count ?? 0,
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1),
  language: z.enum(["en", "es"]).default("en"),
  category: z.enum(["pillar", "data-driven", "comparison", "city-specific", "problem-solution"]).optional(),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  ogImage: z.string().url().optional(),
  targetKeyword: z.string().max(100).optional(),
  relatedPostSlugs: z.array(z.string()).optional(),
  pairedPostId: z.string().optional(),
  slug: z.string().max(100).optional(),
  published: z.boolean().optional(),
});

/**
 * POST /api/blog/posts (admin auth required — enforced by middleware)
 * Create new blog post.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug || slugify(data.title);
  const readingTimeMin = calculateReadingTime(data.body);

  // Check slug uniqueness
  const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const [post] = await db.insert(blogPosts).values({
    title: data.title,
    slug,
    body: data.body,
    language: data.language,
    category: data.category,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    ogImage: data.ogImage,
    targetKeyword: data.targetKeyword,
    relatedPostSlugs: data.relatedPostSlugs,
    pairedPostId: data.pairedPostId,
    readingTimeMin,
    published: data.published ?? false,
    publishedAt: data.published ? now : undefined,
  }).returning();

  return NextResponse.json(post, { status: 201 });
}
