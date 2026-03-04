import type { Metadata } from "next";
import AboutPage from "./AboutClient";

export const metadata: Metadata = {
  title: "About — Calltide | Built in San Antonio for Service Businesses",
  description:
    "Calltide was built because too many great service businesses lose jobs when nobody answers the phone. AI receptionist, bilingual, 24/7.",
  openGraph: {
    title: "About — Calltide | Built in San Antonio. Built for You.",
    description:
      "Every service business deserves a professional front office. Built in San Antonio for home service businesses everywhere.",
    url: "https://calltide.app/about",
    siteName: "Calltide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Calltide",
    description: "Built in Texas. AI receptionist for home service businesses.",
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
            name: "Calltide LLC",
            url: "https://calltide.app",
            description: "AI-powered bilingual virtual receptionist for home service businesses.",
            email: "hello@calltide.app",
            telephone: "+18305217133",
            areaServed: "US",
            sameAs: ["https://calltide.app"],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Calltide",
            description:
              "AI-powered bilingual receptionist platform for home service businesses.",
            url: "https://calltide.app",
            telephone: "+1-830-521-7133",
            email: "hello@calltide.app",
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
