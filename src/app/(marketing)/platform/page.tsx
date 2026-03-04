import type { Metadata } from "next";
import PlatformClient from "./PlatformClient";

export const metadata: Metadata = {
  title: "Platform | Calltide — The Complete AI Receptionist",
  description:
    "Everything you need to never miss a call again. 24/7 bilingual answering, appointment booking, emergency detection, CRM, analytics, compliance — all in one platform.",
  openGraph: {
    title: "Platform | Calltide — The Complete AI Receptionist",
    description:
      "24/7 bilingual call answering, scheduling, CRM, analytics, compliance — everything included in one AI receptionist platform.",
    url: "https://calltide.app/platform",
    siteName: "Calltide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform | Calltide",
    description: "The complete AI receptionist platform for home service businesses.",
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
            name: "Calltide AI Receptionist Platform",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "AI-powered bilingual virtual receptionist with scheduling, CRM, analytics, and compliance. Everything included.",
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
