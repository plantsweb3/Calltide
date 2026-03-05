import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { sql, asc, eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const createCategorySchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  nameEs: z.string().max(200).nullish(),
  description: z.string().max(500).nullish(),
  descriptionEs: z.string().max(500).nullish(),
  icon: z.string().max(50).nullish(),
  sortOrder: z.number().int().min(0).default(0),
});

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
    reportError("Error fetching help categories", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

/**
 * POST /api/admin/help/categories
 * Create a new help category.
 */
export async function POST(req: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createCategorySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const body = parsed.data;

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
        sortOrder: body.sortOrder,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Error creating help category", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
