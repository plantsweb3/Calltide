import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contentQueue } from "@/db/schema";
import { eq } from "drizzle-orm";

const updateSchema = z.object({
  platform: z.string().min(1).optional(),
  language: z.string().optional(),
  title: z.string().min(1).max(300).optional(),
  body: z.string().min(1).optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  scheduledFor: z.string().nullable().optional(),
  status: z.enum(["draft", "approved", "published"]).optional(),
});

/**
 * PATCH /api/content-queue/[id] (admin auth required)
 * Update a content queue item.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rawBody = await req.json();
  const parsed = updateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [existing] = await db.select({ id: contentQueue.id }).from(contentQueue).where(eq(contentQueue.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Content item not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  const data = parsed.data;

  if (data.platform !== undefined) updates.platform = data.platform;
  if (data.language !== undefined) updates.language = data.language;
  if (data.title !== undefined) updates.title = data.title;
  if (data.body !== undefined) updates.body = data.body;
  if (data.category !== undefined) updates.category = data.category;
  if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
  if (data.scheduledFor !== undefined) updates.scheduledFor = data.scheduledFor;
  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === "published") {
      updates.publishedAt = new Date().toISOString();
    }
  }

  await db.update(contentQueue).set(updates).where(eq(contentQueue.id, id));

  const [updated] = await db.select().from(contentQueue).where(eq(contentQueue.id, id)).limit(1);
  return NextResponse.json(updated);
}

/**
 * DELETE /api/content-queue/[id] (admin auth required)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [existing] = await db.select({ id: contentQueue.id }).from(contentQueue).where(eq(contentQueue.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Content item not found" }, { status: 404 });
  }

  await db.delete(contentQueue).where(eq(contentQueue.id, id));
  return NextResponse.json({ success: true });
}
