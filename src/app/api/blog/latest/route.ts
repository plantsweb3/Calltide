import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const posts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      metaDescription: blogPosts.metaDescription,
      category: blogPosts.category,
      readingTimeMin: blogPosts.readingTimeMin,
      publishedAt: blogPosts.publishedAt,
      language: blogPosts.language,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.published, true), eq(blogPosts.language, "en")))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);

  return NextResponse.json(posts, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate" },
  });
}
