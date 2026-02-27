/**
 * Inserts all hardcoded KB articles into the database.
 * Run: npx tsx scripts/kb-articles/index.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, count } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import type { ArticleData } from "./types";

import { articles as gettingStarted } from "./getting-started";
import { articles as managingCalls } from "./managing-calls";
import { articles as billingAccount } from "./billing-account";
import { articles as troubleshooting } from "./troubleshooting";
import { articles as featuresTips } from "./features-tips";
import { articles as forProspects } from "./for-prospects";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const db = drizzle(client, { schema });

const ALL_ARTICLES: ArticleData[] = [
  ...gettingStarted,
  ...managingCalls,
  ...billingAccount,
  ...troubleshooting,
  ...featuresTips,
  ...forProspects,
];

async function main() {
  console.log("=== Calltide KB Article Seeder ===\n");

  // Get category map
  const cats = await db.select().from(schema.helpCategories);
  if (cats.length === 0) {
    console.error("No categories found! Run seed-and-generate-kb.ts first to seed categories.");
    process.exit(1);
  }
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));
  console.log(`Found ${cats.length} categories.`);

  // Check existing articles
  const existingSlugs = new Set(
    (await db.select({ slug: schema.helpArticles.slug }).from(schema.helpArticles)).map((a) => a.slug),
  );
  console.log(`Existing articles: ${existingSlugs.size}`);

  const toInsert = ALL_ARTICLES.filter((a) => !existingSlugs.has(a.slug));
  console.log(`Articles to insert: ${toInsert.length}\n`);

  let inserted = 0;
  for (const article of toInsert) {
    const categoryId = catMap.get(article.categorySlug);
    if (!categoryId) {
      console.log(`SKIP: No category for "${article.categorySlug}"`);
      continue;
    }

    await db.insert(schema.helpArticles).values({
      categoryId,
      slug: article.slug,
      title: article.title,
      titleEs: article.titleEs,
      excerpt: article.excerpt,
      excerptEs: article.excerptEs,
      content: article.content,
      contentEs: article.contentEs,
      metaTitle: article.metaTitle,
      metaTitleEs: article.metaTitleEs,
      metaDescription: article.metaDescription,
      metaDescriptionEs: article.metaDescriptionEs,
      searchKeywords: article.searchKeywords,
      searchKeywordsEs: article.searchKeywordsEs,
      relatedArticles: [],
      dashboardContextRoutes: article.dashboardContextRoutes,
      status: "published",
      publishedAt: new Date().toISOString(),
      readingTimeMinutes: article.readingTimeMinutes,
      sortOrder: article.sortOrder,
    });

    inserted++;
    console.log(`  [${inserted}/${toInsert.length}] ${article.title}`);
  }

  // Update category article counts
  console.log("\nUpdating category article counts...");
  for (const cat of cats) {
    const [result] = await db
      .select({ c: count() })
      .from(schema.helpArticles)
      .where(eq(schema.helpArticles.categoryId, cat.id));
    await db
      .update(schema.helpCategories)
      .set({ articleCount: result.c })
      .where(eq(schema.helpCategories.id, cat.id));
  }

  const [finalCount] = await db.select({ c: count() }).from(schema.helpArticles);
  console.log(`\n=== DONE === Total articles: ${finalCount.c}, Inserted: ${inserted}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
