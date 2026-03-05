import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const createArticleSchema = z.object({
  categoryId: z.string().min(1),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  titleEs: z.string().max(300).nullish(),
  excerpt: z.string().max(500).nullish(),
  excerptEs: z.string().max(500).nullish(),
  content: z.string().min(1),
  contentEs: z.string().nullish(),
  metaTitle: z.string().max(200).nullish(),
  metaTitleEs: z.string().max(200).nullish(),
  metaDescription: z.string().max(500).nullish(),
  metaDescriptionEs: z.string().max(500).nullish(),
  searchKeywords: z.string().max(500).nullish(),
  searchKeywordsEs: z.string().max(500).nullish(),
  relatedArticles: z.array(z.string()).nullish(),
  dashboardContextRoutes: z.array(z.string()).nullish(),
  status: z.enum(["draft", "published"]).default("draft"),
  sortOrder: z.number().int().min(0).default(0),
});

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
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createArticleSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const body = parsed.data;

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
        status: body.status,
        sortOrder: body.sortOrder,
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
