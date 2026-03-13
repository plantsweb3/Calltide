import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  const posts = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.published, true), eq(blogPosts.language, "es")))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(50);

  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const items = posts
    .map((post) => {
      const link = `${appUrl}/es/blog/${post.slug}`;
      return `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escapeXml(post.metaDescription ?? "")}</description>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ""}</pubDate>
      <language>es</language>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Capta Blog — Español</title>
    <link>${appUrl}/es/blog</link>
    <description>Consejos, datos e ideas para negocios de servicios del hogar.</description>
    <language>es</language>
    <atom:link href="${appUrl}/es/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
