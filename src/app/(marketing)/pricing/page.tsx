import type { Metadata } from "next";
import PricingPage from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing — Calltide | AI Receptionist for Home Service Businesses",
  description:
    "One plan, everything included. $497/month for unlimited calls, bilingual EN/ES, appointment booking, SMS, emergency detection, and 7 AI agents. Free for 14 days.",
  openGraph: {
    title: "Pricing — Calltide | Everything Included",
    description:
      "One plan, everything included. Unlimited calls, bilingual support, appointment booking, and more. Free for 14 days.",
    url: "https://calltide.app/pricing",
    siteName: "Calltide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Calltide",
    description: "One plan, everything included. Free for 14 days.",
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
            name: "Calltide AI Receptionist",
            description: "AI-powered bilingual virtual receptionist for home service businesses. Answers calls 24/7 in English and Spanish.",
            brand: { "@type": "Brand", name: "Calltide" },
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "397",
              highPrice: "497",
              priceCurrency: "USD",
              offerCount: "2",
            },
          }),
        }}
      />
      <PricingPage />
    </>
  );
}
