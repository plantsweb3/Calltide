import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { sql, asc, eq } from "drizzle-orm";

/**
 * GET /api/admin/help/categories
 * List all categories with computed article counts via subquery.
 */
export async function GET() {
  try {
    const categories = await db
      .select({
        id: helpCategories.id,
        slug: helpCategories.slug,
        name: helpCategories.name,
        nameEs: helpCategories.nameEs,
        description: helpCategories.description,
        descriptionEs: helpCategories.descriptionEs,
        icon: helpCategories.icon,
        sortOrder: helpCategories.sortOrder,
        createdAt: helpCategories.createdAt,
        updatedAt: helpCategories.updatedAt,
        articleCount: sql<number>`(SELECT COUNT(*) FROM help_articles WHERE help_articles.category_id = ${helpCategories.id})`,
      })
      .from(helpCategories)
      .orderBy(asc(helpCategories.sortOrder));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching help categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

/**
 * POST /api/admin/help/categories
 * Create a new help category.
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

    if (!body.slug || !body.name) {
      return NextResponse.json(
        { error: "slug and name are required" },
        { status: 400 },
      );
    }

    // Check for duplicate slug
    const [existing] = await db
      .select({ id: helpCategories.id })
      .from(helpCategories)
      .where(eq(helpCategories.slug, body.slug))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
    }

    const [created] = await db
      .insert(helpCategories)
      .values({
        slug: body.slug,
        name: body.name,
        nameEs: body.nameEs ?? null,
        description: body.description ?? null,
        descriptionEs: body.descriptionEs ?? null,
        icon: body.icon ?? null,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating help category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
