import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/admin/help/articles
 * List all articles (including drafts) with category info, sorted by category sortOrder then article sortOrder.
 */
export async function GET() {
  try {
    const articles = await db
      .select({
        id: helpArticles.id,
        categoryId: helpArticles.categoryId,
        slug: helpArticles.slug,
        title: helpArticles.title,
        titleEs: helpArticles.titleEs,
        excerpt: helpArticles.excerpt,
        excerptEs: helpArticles.excerptEs,
        content: helpArticles.content,
        contentEs: helpArticles.contentEs,
        metaTitle: helpArticles.metaTitle,
        metaTitleEs: helpArticles.metaTitleEs,
        metaDescription: helpArticles.metaDescription,
        metaDescriptionEs: helpArticles.metaDescriptionEs,
        relatedArticles: helpArticles.relatedArticles,
        dashboardContextRoutes: helpArticles.dashboardContextRoutes,
        status: helpArticles.status,
        viewCount: helpArticles.viewCount,
        helpfulYes: helpArticles.helpfulYes,
        helpfulNo: helpArticles.helpfulNo,
        searchKeywords: helpArticles.searchKeywords,
        searchKeywordsEs: helpArticles.searchKeywordsEs,
        readingTimeMinutes: helpArticles.readingTimeMinutes,
        sortOrder: helpArticles.sortOrder,
        publishedAt: helpArticles.publishedAt,
        createdAt: helpArticles.createdAt,
        updatedAt: helpArticles.updatedAt,
        categoryName: helpCategories.name,
        categorySlug: helpCategories.slug,
        categoryIcon: helpCategories.icon,
        categorySortOrder: helpCategories.sortOrder,
      })
      .from(helpArticles)
      .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
      .orderBy(asc(helpCategories.sortOrder), asc(helpArticles.sortOrder));

    return NextResponse.json(articles);
  } catch (error) {
    reportError("Error fetching help articles", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

/**
 * POST /api/admin/help/articles
 * Create a new help article.
 */
export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.categoryId || !body.slug || !body.title || !body.content) {
      return NextResponse.json(
        { error: "categoryId, slug, title, and content are required" },
        { status: 400 },
      );
    }

    // Verify category exists
    const [category] = await db
      .select({ id: helpCategories.id })
      .from(helpCategories)
      .where(eq(helpCategories.id, body.categoryId))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Auto-calculate reading time: words / 200, rounded up, minimum 1
    const wordCount = body.content.trim().split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const [created] = await db
      .insert(helpArticles)
      .values({
        categoryId: body.categoryId,
        slug: body.slug,
        title: body.title,
        titleEs: body.titleEs ?? null,
        excerpt: body.excerpt ?? null,
        excerptEs: body.excerptEs ?? null,
        content: body.content,
        contentEs: body.contentEs ?? null,
        metaTitle: body.metaTitle ?? null,
        metaTitleEs: body.metaTitleEs ?? null,
        metaDescription: body.metaDescription ?? null,
        metaDescriptionEs: body.metaDescriptionEs ?? null,
        searchKeywords: body.searchKeywords ?? null,
        searchKeywordsEs: body.searchKeywordsEs ?? null,
        relatedArticles: body.relatedArticles ?? null,
        dashboardContextRoutes: body.dashboardContextRoutes ?? null,
        status: body.status ?? "draft",
        sortOrder: body.sortOrder ?? 0,
        readingTimeMinutes,
        publishedAt: body.status === "published" ? new Date().toISOString() : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Error creating help article", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
