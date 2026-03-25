import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, like, or } from "drizzle-orm";

interface HelpResult {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  slug: string;
}

/**
 * Search the Capta help knowledge base for answers.
 * Maria uses this to answer questions about how Capta works.
 */
export async function searchHelp(query: string): Promise<HelpResult[]> {
  const normalizedQuery = query.toLowerCase().trim();
  const keywords = normalizedQuery.split(/\s+/).filter((w) => w.length > 2);

  // Search across title, content, and keywords
  const articles = await db
    .select({
      title: helpArticles.title,
      excerpt: helpArticles.excerpt,
      content: helpArticles.content,
      slug: helpArticles.slug,
      categoryId: helpArticles.categoryId,
      searchKeywords: helpArticles.searchKeywords,
    })
    .from(helpArticles)
    .where(eq(helpArticles.status, "published"));

  // Score and rank results
  const scored = articles
    .map((article) => {
      let score = 0;
      const titleLower = (article.title || "").toLowerCase();
      const contentLower = (article.content || "").toLowerCase();
      const keywordsLower = (article.searchKeywords || "").toLowerCase();

      for (const kw of keywords) {
        if (titleLower.includes(kw)) score += 10;
        if (keywordsLower.includes(kw)) score += 5;
        if (contentLower.includes(kw)) score += 1;
      }

      // Exact phrase match bonus
      if (titleLower.includes(normalizedQuery)) score += 20;
      if (contentLower.includes(normalizedQuery)) score += 5;

      return { article, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) return [];

  // Look up category names
  const categories = await db.select().from(helpCategories);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return scored.map((s) => ({
    title: s.article.title,
    excerpt: s.article.excerpt || "",
    content: s.article.content || "",
    category: catMap.get(s.article.categoryId) || "General",
    slug: s.article.slug,
  }));
}

/**
 * Quick-reference knowledge that Maria always knows without searching.
 * This is injected into her system prompt.
 */
export const CAPTA_QUICK_REFERENCE = `
## Capta Quick Reference (for answering owner questions)

### Pricing
- $497/month flat rate — unlimited calls, all features included
- Annual plan: $397/month ($4,764/year, saves $1,200/year)
- No per-minute billing, no call limits, no hidden fees
- 14-day free trial (card on file, no charge until day 15)

### Key Features
- Bilingual (English & Spanish) — automatic detection
- 24/7 call answering with custom greeting
- Appointment booking + SMS confirmations
- Emergency detection and live transfer
- AI estimates with owner confirmation loop
- Missed call recovery (auto-texts within 60 seconds)
- Job cards with photo intake
- Estimate follow-up automation
- Customer recall campaigns
- Google review requests
- Weekly digest + daily summary
- Full CRM with call history and recordings
- Partner referral network

### Dashboard Pages
- Overview: call stats, customer insights, revenue metrics
- Calls: history with audio playback, transcripts, QA scores
- Appointments: upcoming/past, booking management
- SMS: all message threads with customers
- Customers: auto-populated CRM with full history
- Estimates: Kanban pipeline with follow-up automation
- Job Cards: structured job tracking with photos
- Referrals: referral program tracking
- Partners: partner referral network management
- Import: CSV bulk import for customers and leads
- Billing: plan details, invoices, Stripe portal
- Settings: hours, services, greeting, personality, custom FAQ, intake questions, pricing

### Support
- Email: support@captahq.com
- Phone: (830) 521-7133
`.trim();
