import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing | Calltide",
  description:
    "One plan. Everything included. $497/month for your AI front office. Unlimited calls, AI estimates, missed call recovery, follow-up automation, CRM, and 55+ features. 30-day money-back guarantee.",
  openGraph: {
    title: "Pricing | Calltide",
    description:
      "One plan. Everything included. $497/month — your AI front office with unlimited calls, AI estimates, missed call recovery, and every feature included.",
    url: "https://calltide.app/pricing",
    siteName: "Calltide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Calltide",
    description:
      "One plan. Everything included. $497/month — your AI front office with 55+ features.",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Calltide AI Front Office",
            description:
              "AI front office for home service businesses. Answers calls, generates estimates, recovers missed calls, and manages follow-ups — in English and Spanish, 24/7. One plan, everything included.",
            brand: { "@type": "Brand", name: "Calltide" },
            offers: [
              {
                "@type": "Offer",
                name: "Monthly Plan",
                price: "497",
                priceCurrency: "USD",
                priceValidUntil: "2027-12-31",
                availability: "https://schema.org/InStock",
                url: "https://calltide.app/pricing",
              },
              {
                "@type": "Offer",
                name: "Annual Plan",
                price: "4970",
                priceCurrency: "USD",
                priceValidUntil: "2027-12-31",
                availability: "https://schema.org/InStock",
                url: "https://calltide.app/pricing",
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is there a contract?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Month-to-month. Cancel anytime. Annual plan available at $4,764/year (save $1,200).",
                },
              },
              {
                "@type": "Question",
                name: "Are there any extra fees?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Unlimited calls, unlimited features. $497/month covers everything.",
                },
              },
              {
                "@type": "Question",
                name: "What if I need help setting up?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We walk you through everything. Most businesses are live in 24 hours.",
                },
              },
            ],
          }),
        }}
      />
      <PricingClient />
    </>
  );
}
