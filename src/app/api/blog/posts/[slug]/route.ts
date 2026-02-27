import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq } from "drizzle-orm";

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * GET /api/blog/posts/[slug] (public)
 * Get single published post by slug.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Only return published posts for public access
  if (!post.published) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Increment page view
  db.update(blogPosts)
    .set({ pageViews: (post.pageViews ?? 0) + 1 })
    .where(eq(blogPosts.id, post.id))
    .catch(() => {});

  return NextResponse.json(post);
}

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().min(1).optional(),
  slug: z.string().max(100).optional(),
  language: z.enum(["en", "es"]).optional(),
  category: z.enum(["pillar", "data-driven", "comparison", "city-specific", "problem-solution"]).nullable().optional(),
  metaTitle: z.string().max(100).nullable().optional(),
  metaDescription: z.string().max(300).nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
  targetKeyword: z.string().max(100).nullable().optional(),
  relatedPostSlugs: z.array(z.string()).nullable().optional(),
  pairedPostId: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

/**
 * PATCH /api/blog/posts/[slug] (admin auth required)
 * Update blog post. Uses slug as identifier but matches by ID internally.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.body !== undefined) {
    updates.body = data.body;
    updates.readingTimeMin = calculateReadingTime(data.body);
  }
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.language !== undefined) updates.language = data.language;
  if (data.category !== undefined) updates.category = data.category;
  if (data.metaTitle !== undefined) updates.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined) updates.metaDescription = data.metaDescription;
  if (data.ogImage !== undefined) updates.ogImage = data.ogImage;
  if (data.targetKeyword !== undefined) updates.targetKeyword = data.targetKeyword;
  if (data.relatedPostSlugs !== undefined) updates.relatedPostSlugs = data.relatedPostSlugs;
  if (data.pairedPostId !== undefined) updates.pairedPostId = data.pairedPostId;

  // Handle publish toggle
  if (data.published !== undefined) {
    updates.published = data.published;
    if (data.published && !post.publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }
  }

  await db.update(blogPosts).set(updates).where(eq(blogPosts.id, post.id));

  const [updated] = await db.select().from(blogPosts).where(eq(blogPosts.id, post.id)).limit(1);
  return NextResponse.json(updated);
}

/**
 * DELETE /api/blog/posts/[slug] (admin auth required)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [post] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await db.delete(blogPosts).where(eq(blogPosts.id, post.id));
  return NextResponse.json({ success: true });
}
