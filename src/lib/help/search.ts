import { db } from "@/db";
import { helpArticles, helpCategories, helpSearchMisses } from "@/db/schema";
import { eq, and, or, like, desc, sql } from "drizzle-orm";

interface SearchOptions {
  lang?: "en" | "es";
  limit?: number;
  category?: string;
  source?: "public" | "widget" | "support_agent";
  businessId?: string;
}

export async function searchArticles(query: string, options?: SearchOptions) {
  const limit = options?.limit ?? 10;
  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (searchTerms.length === 0) return [];

  // Build LIKE conditions across all searchable fields
  const conditions = searchTerms.flatMap((term) => {
    const pat = `%${term}%`;
    return [
      like(helpArticles.title, pat),
      like(helpArticles.titleEs, pat),
      like(helpArticles.searchKeywords, pat),
      like(helpArticles.searchKeywordsEs, pat),
      like(helpArticles.excerpt, pat),
      like(helpArticles.excerptEs, pat),
    ];
  });

  const filters = [eq(helpArticles.status, "published"), or(...conditions)];
  if (options?.category) {
    filters.push(eq(helpArticles.categoryId, options.category));
  }

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
      viewCount: helpArticles.viewCount,
      categoryId: helpArticles.categoryId,
      categorySlug: helpCategories.slug,
      categoryName: helpCategories.name,
      categoryNameEs: helpCategories.nameEs,
    })
    .from(helpArticles)
    .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
    .where(and(...filters))
    .orderBy(desc(helpArticles.viewCount))
    .limit(limit);

  // Log miss if no results
  if (results.length === 0) {
    await db
      .insert(helpSearchMisses)
      .values({
        query,
        source: options?.source ?? "public",
        resultCount: 0,
        businessId: options?.businessId,
      })
      .catch(() => {});
  }

  return results;
}

export async function getArticlesBySlug(slugs: string[]) {
  if (slugs.length === 0) return [];

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

  return results;
}

export async function getPopularArticles(limit = 5) {
  return db
    .select({
      id: helpArticles.id,
      slug: helpArticles.slug,
      title: helpArticles.title,
      titleEs: helpArticles.titleEs,
      excerpt: helpArticles.excerpt,
      excerptEs: helpArticles.excerptEs,
      readingTimeMinutes: helpArticles.readingTimeMinutes,
      viewCount: helpArticles.viewCount,
      categorySlug: helpCategories.slug,
      categoryName: helpCategories.name,
      categoryNameEs: helpCategories.nameEs,
    })
    .from(helpArticles)
    .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
    .where(eq(helpArticles.status, "published"))
    .orderBy(desc(helpArticles.viewCount))
    .limit(limit);
}

export async function getCategoriesWithCounts() {
  return db
    .select({
      id: helpCategories.id,
      slug: helpCategories.slug,
      name: helpCategories.name,
      nameEs: helpCategories.nameEs,
      description: helpCategories.description,
      descriptionEs: helpCategories.descriptionEs,
      icon: helpCategories.icon,
      sortOrder: helpCategories.sortOrder,
      articleCount: sql<number>`(
        SELECT COUNT(*) FROM help_articles
        WHERE help_articles.category_id = help_categories.id
        AND help_articles.status = 'published'
      )`,
    })
    .from(helpCategories)
    .orderBy(helpCategories.sortOrder);
}
