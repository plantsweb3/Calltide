import { db } from "@/db";
import { blogPosts, testimonials } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import LandingPage from "./HomeClient";

export const revalidate = 3600;

export default async function HomePage() {
  const posts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      metaDescription: blogPosts.metaDescription,
      category: blogPosts.category,
      readingTimeMin: blogPosts.readingTimeMin,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.published, true), eq(blogPosts.language, "en")))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);

  // Fetch approved testimonials for Review schema
  const approvedReviews = await db
    .select({
      ownerName: testimonials.ownerName,
      businessName: testimonials.businessName,
      quote: testimonials.quote,
      rating: testimonials.rating,
      submittedAt: testimonials.submittedAt,
    })
    .from(testimonials)
    .where(eq(testimonials.approved, true))
    .orderBy(desc(testimonials.submittedAt))
    .limit(20);

  const [ratingAgg] = approvedReviews.length > 0
    ? await db
        .select({
          avg: sql<number>`avg(${testimonials.rating})`,
          count: sql<number>`count(*)`,
        })
        .from(testimonials)
        .where(and(eq(testimonials.approved, true), sql`${testimonials.rating} IS NOT NULL`))
    : [null];

  // Build Review JSON-LD only if real testimonials exist
  const reviewSchemaScript = approvedReviews.length > 0 && ratingAgg ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Capta",
    url: "https://captahq.com",
    applicationCategory: "BusinessApplication",
    ...(ratingAgg.count > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Math.round(ratingAgg.avg * 10) / 10,
        bestRating: 5,
        ratingCount: ratingAgg.count,
      },
    } : {}),
    review: approvedReviews
      .filter((r) => r.rating)
      .slice(0, 10)
      .map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.ownerName },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.quote,
        datePublished: r.submittedAt,
      })),
  }) : null;

  return (
    <>
      {reviewSchemaScript && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: reviewSchemaScript }}
        />
      )}
      <LandingPage latestPosts={posts} />
    </>
  );
}
