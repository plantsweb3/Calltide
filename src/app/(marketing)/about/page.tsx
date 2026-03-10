import type { Metadata } from "next";
import AboutPage from "./AboutClient";

export const metadata: Metadata = {
  title: "About — Capta | Built in San Antonio for Service Businesses",
  description:
    "Capta was built because too many great service businesses lose jobs when nobody answers the phone. AI front office — answers calls, generates estimates, recovers missed calls, 24/7.",
  openGraph: {
    title: "About — Capta | Built in San Antonio. Built for You.",
    description:
      "Every service business deserves a professional front office. Built in San Antonio for home service businesses everywhere.",
    url: "https://capta.app/about",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Capta",
    description: "Built in Texas. AI front office for home service businesses.",
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
            url: "https://capta.app",
            description: "AI front office for home service businesses. Answers calls, generates estimates, recovers missed calls, and manages follow-ups — bilingual, 24/7.",
            email: "hello@capta.app",
            telephone: "+18305217133",
            areaServed: "US",
            sameAs: ["https://capta.app"],
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
              "AI front office platform for home service businesses — answers calls, generates estimates, recovers missed calls, and grows your business.",
            url: "https://capta.app",
            telephone: "+1-830-521-7133",
            email: "hello@capta.app",
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
