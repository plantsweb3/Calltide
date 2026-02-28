import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { helpArticles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`help-view:${getClientIp(req)}`, { limit: 60, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = z.object({ articleId: z.string().min(1).max(100) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "articleId required" }, { status: 400 });
  }
  const { articleId } = parsed.data;

  await db
    .update(helpArticles)
    .set({ viewCount: sql`view_count + 1` })
    .where(eq(helpArticles.id, articleId));

  return NextResponse.json({ ok: true });
}
