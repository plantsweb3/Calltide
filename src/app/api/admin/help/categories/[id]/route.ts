import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

/**
 * PATCH /api/admin/help/categories/[id]
 * Update category fields.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [existing] = await db
      .select({ id: helpCategories.id })
      .from(helpCategories)
      .where(eq(helpCategories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
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

    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.name !== undefined) updates.name = body.name;
    if (body.nameEs !== undefined) updates.nameEs = body.nameEs;
    if (body.description !== undefined) updates.description = body.description;
    if (body.descriptionEs !== undefined) updates.descriptionEs = body.descriptionEs;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

    const [updated] = await db
      .update(helpCategories)
      .set(updates)
      .where(eq(helpCategories.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    reportError("Error updating help category", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/help/categories/[id]
 * Delete a category only if no articles reference it.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [existing] = await db
      .select({ id: helpCategories.id })
      .from(helpCategories)
      .where(eq(helpCategories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check for articles referencing this category
    const [articleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(helpArticles)
      .where(eq(helpArticles.categoryId, id));

    if (articleCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${articleCount.count} article(s) still reference it` },
        { status: 409 },
      );
    }

    await db.delete(helpCategories).where(eq(helpCategories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Error deleting help category", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
