import { db } from "@/db";
import { blogPosts, helpArticles, helpCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  // Static pages with bilingual alternates
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { en: appUrl, es: `${appUrl}/es`, "x-default": appUrl } },
    },
    {
      url: `${appUrl}/es`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { en: appUrl, es: `${appUrl}/es`, "x-default": appUrl } },
    },
    { url: `${appUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${appUrl}/platform`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${appUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/audit`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${appUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: { languages: { en: `${appUrl}/blog`, es: `${appUrl}/es/blog`, "x-default": `${appUrl}/blog` } },
    },
    {
      url: `${appUrl}/es/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: { languages: { en: `${appUrl}/blog`, es: `${appUrl}/es/blog`, "x-default": `${appUrl}/blog` } },
    },
    {
      url: `${appUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { en: `${appUrl}/help`, es: `${appUrl}/es/help`, "x-default": `${appUrl}/help` } },
    },
    {
      url: `${appUrl}/es/help`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { en: `${appUrl}/help`, es: `${appUrl}/es/help`, "x-default": `${appUrl}/help` } },
    },
    {
      url: `${appUrl}/status`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
      alternates: { languages: { en: `${appUrl}/status`, es: `${appUrl}/es/status`, "x-default": `${appUrl}/status` } },
    },
    {
      url: `${appUrl}/es/status`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
      alternates: { languages: { en: `${appUrl}/status`, es: `${appUrl}/es/status`, "x-default": `${appUrl}/status` } },
    },
    {
      url: `${appUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/terms`, es: `${appUrl}/es/legal/terms`, "x-default": `${appUrl}/legal/terms` } },
    },
    {
      url: `${appUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/privacy`, es: `${appUrl}/es/legal/privacy`, "x-default": `${appUrl}/legal/privacy` } },
    },
    {
      url: `${appUrl}/legal/dpa`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/dpa`, es: `${appUrl}/es/legal/dpa`, "x-default": `${appUrl}/legal/dpa` } },
    },
    {
      url: `${appUrl}/legal/sub-processors`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/sub-processors`, es: `${appUrl}/es/legal/sub-processors`, "x-default": `${appUrl}/legal/sub-processors` } },
    },
    {
      url: `${appUrl}/es/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/terms`, es: `${appUrl}/es/legal/terms`, "x-default": `${appUrl}/legal/terms` } },
    },
    {
      url: `${appUrl}/es/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/privacy`, es: `${appUrl}/es/legal/privacy`, "x-default": `${appUrl}/legal/privacy` } },
    },
    {
      url: `${appUrl}/es/legal/dpa`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/dpa`, es: `${appUrl}/es/legal/dpa`, "x-default": `${appUrl}/legal/dpa` } },
    },
    {
      url: `${appUrl}/es/legal/sub-processors`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: { en: `${appUrl}/legal/sub-processors`, es: `${appUrl}/es/legal/sub-processors`, "x-default": `${appUrl}/legal/sub-processors` } },
    },
  ];

  // Published blog posts — build a map of paired posts for hreflang
  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      language: blogPosts.language,
      updatedAt: blogPosts.updatedAt,
      pairedPostId: blogPosts.pairedPostId,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const postById = new Map(posts.map((p) => [p.id, p]));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const url = post.language === "es"
      ? `${appUrl}/es/blog/${post.slug}`
      : `${appUrl}/blog/${post.slug}`;

    const languages: Record<string, string> = {
      [post.language]: url,
      "x-default": post.language === "en" ? url : undefined!,
    };

    if (post.pairedPostId) {
      const paired = postById.get(post.pairedPostId);
      if (paired) {
        const pairedUrl = paired.language === "es"
          ? `${appUrl}/es/blog/${paired.slug}`
          : `${appUrl}/blog/${paired.slug}`;
        languages[paired.language] = pairedUrl;
        if (paired.language === "en") languages["x-default"] = pairedUrl;
      }
    }

    // If no x-default was set (no EN paired post and this is ES), default to this URL
    if (!languages["x-default"]) languages["x-default"] = url;

    return {
      url,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages },
    };
  });

  // Published help articles — both EN and ES versions share the same URL structure
  const articles = await db
    .select({
      slug: helpArticles.slug,
      updatedAt: helpArticles.updatedAt,
      categorySlug: helpCategories.slug,
    })
    .from(helpArticles)
    .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
    .where(eq(helpArticles.status, "published"));

  const helpPages: MetadataRoute.Sitemap = articles.flatMap((a) => {
    const enUrl = `${appUrl}/help/${a.categorySlug}/${a.slug}`;
    const esUrl = `${appUrl}/es/help/${a.categorySlug}/${a.slug}`;
    const langs = { en: enUrl, es: esUrl, "x-default": enUrl };

    return [
      {
        url: enUrl,
        lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
        alternates: { languages: langs },
      },
      {
        url: esUrl,
        lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
        alternates: { languages: langs },
      },
    ];
  });

  return [...staticPages, ...blogPages, ...helpPages];
}
