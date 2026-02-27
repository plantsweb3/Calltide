import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

/**
 * GET /api/help/articles
 * Public: ?slugs=slug1,slug2 — returns articles by slug (for widget)
 * Admin: full list (handled by /api/admin/help/articles instead)
 */
export async function GET(req: NextRequest) {
  const slugsParam = req.nextUrl.searchParams.get("slugs");

  if (slugsParam) {
    const slugs = slugsParam.split(",").filter(Boolean).slice(0, 20);
    if (slugs.length === 0) return NextResponse.json({ articles: [] });

    const results = await db
      .select({
        id: helpArticles.id,
        slug: helpArticles.slug,
        title: helpArticles.title,
        titleEs: helpArticles.titleEs,
        excerpt: helpArticles.excerpt,
        excerptEs: helpArticles.excerptEs,
        content: helpArticles.content,
        contentEs: helpArticles.contentEs,
        readingTimeMinutes: helpArticles.readingTimeMinutes,
        categorySlug: helpCategories.slug,
        categoryName: helpCategories.name,
      })
      .from(helpArticles)
      .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
      .where(
        and(
          eq(helpArticles.status, "published"),
          or(...slugs.map((s) => eq(helpArticles.slug, s))),
        ),
      );

    return NextResponse.json({ articles: results });
  }

  // Default: return all published articles (public listing)
  const articles = await db
    .select({
      id: helpArticles.id,
      slug: helpArticles.slug,
      title: helpArticles.title,
      titleEs: helpArticles.titleEs,
      excerpt: helpArticles.excerpt,
      excerptEs: helpArticles.excerptEs,
      readingTimeMinutes: helpArticles.readingTimeMinutes,
      viewCount: helpArticles.viewCount,
      categoryId: helpArticles.categoryId,
      categorySlug: helpCategories.slug,
      categoryName: helpCategories.name,
      categoryNameEs: helpCategories.nameEs,
      sortOrder: helpArticles.sortOrder,
    })
    .from(helpArticles)
    .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
    .where(eq(helpArticles.status, "published"))
    .orderBy(helpCategories.sortOrder, helpArticles.sortOrder);

  return NextResponse.json({ articles });
}
