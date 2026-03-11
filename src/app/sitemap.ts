import { db } from "@/db";
import { blogPosts, helpArticles, helpCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://capta.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/es`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${appUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${appUrl}/platform`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${appUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/audit`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${appUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${appUrl}/es/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${appUrl}/help`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${appUrl}/es/help`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${appUrl}/status`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
    { url: `${appUrl}/es/status`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
    { url: `${appUrl}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/legal/dpa`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/legal/sub-processors`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/es/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/es/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/es/legal/dpa`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/es/legal/sub-processors`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Published blog posts
  const posts = await db
    .select({ slug: blogPosts.slug, language: blogPosts.language, updatedAt: blogPosts.updatedAt })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: post.language === "es"
      ? `${appUrl}/es/blog/${post.slug}`
      : `${appUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Published help articles
  const articles = await db
    .select({
      slug: helpArticles.slug,
      updatedAt: helpArticles.updatedAt,
      categorySlug: helpCategories.slug,
    })
    .from(helpArticles)
    .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
    .where(eq(helpArticles.status, "published"));

  const helpPages: MetadataRoute.Sitemap = articles.flatMap((a) => [
    {
      url: `${appUrl}/help/${a.categorySlug}/${a.slug}`,
      lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${appUrl}/es/help/${a.categorySlug}/${a.slug}`,
      lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ]);

  return [...staticPages, ...blogPages, ...helpPages];
}
