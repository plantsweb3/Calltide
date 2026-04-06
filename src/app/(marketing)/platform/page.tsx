import type { Metadata } from "next";
import PlatformClient from "./PlatformClient";

export const metadata: Metadata = {
  title: "Platform | Capta — 30+ Automations, One AI, One Text",
  description:
    "30+ automations that answer calls, generate estimates, recover missed calls, and grow your business — all triggered by voice and SMS. Bilingual AI receptionist, CRM, scheduling, follow-ups, and more.",
  openGraph: {
    title: "Platform | Capta — 30+ Automations, One AI, One Text",
    description:
      "30+ automations: bilingual answering, AI estimates, missed call recovery, follow-up SMS, CRM, scheduling — everything runs automatically in one AI front office.",
    url: "https://captahq.com/platform",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform | Capta",
    description: "30+ automations that run your front office — calls, estimates, follow-ups, SMS. All automatic, all bilingual.",
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
              "30+ automations for home service businesses. Answers calls, generates estimates, recovers missed calls, manages follow-ups via SMS, and grows your business — in English and Spanish, 24/7.",
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
