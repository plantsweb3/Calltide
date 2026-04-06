import type { Metadata } from "next";
import AboutPage from "./AboutClient";

export const metadata: Metadata = {
  title: "About — Capta | Built in San Antonio for Service Businesses",
  description:
    "Capta was built because too many great service businesses lose jobs to missed calls and manual busywork. AI that answers every call AND automates your entire front office — dispatching, invoicing, follow-ups — all from your text messages.",
  openGraph: {
    title: "About — Capta | Built in San Antonio. Built for You.",
    description:
      "AI that answers calls AND automates your entire front office. Dispatching, invoicing, follow-ups — all from your texts. Built in San Antonio for home service businesses everywhere.",
    url: "https://captahq.com/about",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Capta",
    description: "Built in Texas. AI that answers calls and automates your entire front office via SMS.",
  },
  alternates: {
    canonical: "/about",
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
            "@type": "Organization",
            name: "Capta LLC",
            url: "https://captahq.com",
            description: "AI front office for home service businesses. Answers calls AND automates your entire office — dispatching, invoicing, follow-ups — all via SMS. Bilingual, 24/7.",
            email: "hello@captahq.com",
            telephone: "+18305217133",
            areaServed: "US",
            sameAs: ["https://captahq.com"],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Capta",
            description:
              "AI front office platform for home service businesses — answers calls AND automates your entire office via SMS. Dispatching, invoicing, follow-ups — from your texts.",
            url: "https://captahq.com",
            telephone: "+1-830-521-7133",
            email: "hello@captahq.com",
            address: {
              "@type": "PostalAddress",
              addressLocality: "San Antonio",
              addressRegion: "TX",
              addressCountry: "US",
            },
            founder: {
              "@type": "Person",
              name: "Ulysses Munoz",
            },
            priceRange: "$497/mo",
            openingHours: "Mo-Su 00:00-23:59",
            areaServed: {
              "@type": "Country",
              name: "United States",
            },
          }),
        }}
      />
      <AboutPage />
    </>
  );
}
