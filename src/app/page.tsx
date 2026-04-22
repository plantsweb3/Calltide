import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import LandingPage from "./HomeClient";

export const dynamic = "force-dynamic";

type ReviewRow = {
  ownerName: string;
  businessName: string;
  quote: string;
  rating: number | null;
  submittedAt: string;
};

export default async function HomePage() {
  // Guard against a missing database (local dev without TURSO_DATABASE_URL).
  // The homepage should still render; marketing copy is static.
  let approvedReviews: ReviewRow[] = [];
  let ratingAgg: { avg: number; count: number } | null = null;

  try {
    approvedReviews = await db
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

    if (approvedReviews.length > 0) {
      const [agg] = await db
        .select({
          avg: sql<number>`avg(${testimonials.rating})`,
          count: sql<number>`count(*)`,
        })
        .from(testimonials)
        .where(and(eq(testimonials.approved, true), sql`${testimonials.rating} IS NOT NULL`));
      ratingAgg = agg ?? null;
    }
  } catch {
    // DB unavailable — skip review schema.
  }

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
      <LandingPage />
    </>
  );
}
