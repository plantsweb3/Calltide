import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/help/search";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`help-search:${getClientIp(req)}`, { limit: 30, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], totalResults: 0, query: q ?? "" });
  }

  const lang = req.nextUrl.searchParams.get("lang") as "en" | "es" | null;
  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "10")), 20);
  const category = req.nextUrl.searchParams.get("category");

  const results = await searchArticles(q, {
    lang: lang ?? undefined,
    limit,
    category: category ?? undefined,
    source: "public",
  });

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      titleEs: r.titleEs,
      excerpt: r.excerpt,
      excerptEs: r.excerptEs,
      categorySlug: r.categorySlug,
      categoryName: r.categoryName,
      readingTimeMinutes: r.readingTimeMinutes,
    })),
    totalResults: results.length,
    query: q,
  });
}
