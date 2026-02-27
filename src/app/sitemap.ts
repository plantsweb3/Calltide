import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/audit`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${appUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${appUrl}/es/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
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

  return [...staticPages, ...blogPages];
}
