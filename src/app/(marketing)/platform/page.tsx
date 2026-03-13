import type { Metadata } from "next";
import PlatformClient from "./PlatformClient";

export const metadata: Metadata = {
  title: "Platform | Capta — The Complete AI Front Office",
  description:
    "55+ features that answer calls, generate estimates, recover missed calls, and grow your business. Bilingual answering, CRM, scheduling, follow-ups, and more — all in one platform.",
  openGraph: {
    title: "Platform | Capta — The Complete AI Front Office",
    description:
      "55+ features: bilingual answering, AI estimates, missed call recovery, follow-up automation, CRM, scheduling — everything in one AI front office platform.",
    url: "https://captahq.com/platform",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform | Capta",
    description: "The complete AI front office platform for home service businesses.",
  },
  alternates: {
    canonical: "/platform",
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
            "@type": "SoftwareApplication",
            name: "Capta AI Front Office Platform",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "AI front office for home service businesses. Answers calls, generates estimates, recovers missed calls, manages follow-ups, and grows your business — in English and Spanish, 24/7.",
            offers: {
              "@type": "Offer",
              price: "497",
              priceCurrency: "USD",
            },
          }),
        }}
      />
      <PlatformClient />
    </>
  );
}
