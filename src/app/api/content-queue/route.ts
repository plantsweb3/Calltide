import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contentQueue } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/content-queue (admin auth required)
 * List content queue items with optional status filter.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const status = params.get("status");

  const query = db.select().from(contentQueue).orderBy(desc(contentQueue.createdAt));

  if (status) {
    query.where(eq(contentQueue.status, status));
  }

  const data = await query;
  return NextResponse.json(data);
}

const createSchema = z.object({
  platform: z.string().min(1),
  language: z.enum(["EN", "ES"]).default("EN"),
  title: z.string().min(1).max(300),
  body: z.string().min(1),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  scheduledFor: z.string().optional(),
});

/**
 * POST /api/content-queue (admin auth required)
 * Create a new content queue item.
 */
export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const [item] = await db
    .insert(contentQueue)
    .values({
      platform: data.platform,
      language: data.language.toLowerCase(),
      title: data.title,
      body: data.body,
      category: data.category,
      imageUrl: data.imageUrl,
      scheduledFor: data.scheduledFor,
      status: "draft",
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
