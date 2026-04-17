import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { helpArticles, helpArticleFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const articleUpdateSchema = z.object({
  categoryId: z.string().uuid().optional(),
  slug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(300).optional(),
  titleEs: z.string().max(300).nullable().optional(),
  excerpt: z.string().max(500).nullable().optional(),
  excerptEs: z.string().max(500).nullable().optional(),
  content: z.string().max(100_000).optional(),
  contentEs: z.string().max(100_000).nullable().optional(),
  metaTitle: z.string().max(70).nullable().optional(),
  metaTitleEs: z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(200).nullable().optional(),
  metaDescriptionEs: z.string().max(200).nullable().optional(),
  searchKeywords: z.string().max(500).nullable().optional(),
  searchKeywordsEs: z.string().max(500).nullable().optional(),
  relatedArticles: z.array(z.string().uuid()).max(20).nullable().optional(),
  dashboardContextRoutes: z.array(z.string().max(200)).max(50).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  sortOrder: z.number().int().optional(),
});

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
    reportError("Error fetching help article", error);
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

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = articleUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const body = parsed.data;
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
      if (body.content.trim()) {
        const wordCount = body.content.trim().split(/\s+/).length;
        updates.readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
      }
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
    reportError("Error updating help article", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/help/articles/[id]
 * Soft-delete an article by setting status to "archived".
 * Data and feedback are preserved for potential recovery.
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

    // Soft delete — set status to archived instead of removing data
    await db
      .update(helpArticles)
      .set({ status: "archived", updatedAt: new Date().toISOString() })
      .where(eq(helpArticles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Error archiving help article", error);
    return NextResponse.json({ error: "Failed to archive article" }, { status: 500 });
  }
}
