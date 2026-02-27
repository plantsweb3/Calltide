import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { helpArticles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`help-view:${getClientIp(req)}`, { limit: 60, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  const { articleId } = (await req.json()) as { articleId: string };
  if (!articleId) {
    return NextResponse.json({ error: "articleId required" }, { status: 400 });
  }

  await db
    .update(helpArticles)
    .set({ viewCount: sql`view_count + 1` })
    .where(eq(helpArticles.id, articleId));

  return NextResponse.json({ ok: true });
}
