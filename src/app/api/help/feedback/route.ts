import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { helpArticleFeedback, helpArticles } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`help-feedback:${getClientIp(req)}`, { limit: 20, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { articleId, helpful, sessionId } = body as {
    articleId: string;
    helpful: boolean;
    sessionId?: string;
  };

  if (!articleId || typeof helpful !== "boolean") {
    return NextResponse.json({ error: "articleId and helpful required" }, { status: 400 });
  }

  // Prevent duplicate from same session
  if (sessionId) {
    const existing = await db
      .select({ id: helpArticleFeedback.id })
      .from(helpArticleFeedback)
      .where(
        and(
          eq(helpArticleFeedback.articleId, articleId),
          eq(helpArticleFeedback.sessionId, sessionId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  await db.insert(helpArticleFeedback).values({ articleId, helpful, sessionId });

  // Update denormalized counts
  if (helpful) {
    await db
      .update(helpArticles)
      .set({ helpfulYes: sql`helpful_yes + 1` })
      .where(eq(helpArticles.id, articleId));
  } else {
    await db
      .update(helpArticles)
      .set({ helpfulNo: sql`helpful_no + 1` })
      .where(eq(helpArticles.id, articleId));
  }

  return NextResponse.json({ ok: true });
}
