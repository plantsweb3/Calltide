import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { helpArticles, helpArticleFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/admin/help/articles/[id]
 * Fetch a single article by ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [article] = await db
      .select()
      .from(helpArticles)
      .where(eq(helpArticles.id, id))
      .limit(1);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching help article:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/help/articles/[id]
 * Update article fields. Recalculates readingTimeMinutes if content changes.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [existing] = await db
      .select({ id: helpArticles.id })
      .from(helpArticles)
      .where(eq(helpArticles.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.title !== undefined) updates.title = body.title;
    if (body.titleEs !== undefined) updates.titleEs = body.titleEs;
    if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
    if (body.excerptEs !== undefined) updates.excerptEs = body.excerptEs;
    if (body.content !== undefined) {
      updates.content = body.content;
      // Recalculate reading time when content changes
      const wordCount = body.content.trim().split(/\s+/).length;
      updates.readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    }
    if (body.contentEs !== undefined) updates.contentEs = body.contentEs;
    if (body.metaTitle !== undefined) updates.metaTitle = body.metaTitle;
    if (body.metaTitleEs !== undefined) updates.metaTitleEs = body.metaTitleEs;
    if (body.metaDescription !== undefined) updates.metaDescription = body.metaDescription;
    if (body.metaDescriptionEs !== undefined) updates.metaDescriptionEs = body.metaDescriptionEs;
    if (body.searchKeywords !== undefined) updates.searchKeywords = body.searchKeywords;
    if (body.searchKeywordsEs !== undefined) updates.searchKeywordsEs = body.searchKeywordsEs;
    if (body.relatedArticles !== undefined) updates.relatedArticles = body.relatedArticles;
    if (body.dashboardContextRoutes !== undefined) updates.dashboardContextRoutes = body.dashboardContextRoutes;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "published") {
        updates.publishedAt = new Date().toISOString();
      }
    }
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

    const [updated] = await db
      .update(helpArticles)
      .set(updates)
      .where(eq(helpArticles.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating help article:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/help/articles/[id]
 * Delete an article and its related feedback entries.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [existing] = await db
      .select({ id: helpArticles.id })
      .from(helpArticles)
      .where(eq(helpArticles.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Delete related feedback entries first
    await db.delete(helpArticleFeedback).where(eq(helpArticleFeedback.articleId, id));

    // Delete the article
    await db.delete(helpArticles).where(eq(helpArticles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting help article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
