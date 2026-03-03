import type { Metadata } from "next";
import PlatformPage from "./PlatformClient";

export const metadata: Metadata = {
  title: "Platform — Calltide | AI Receptionist Features",
  description:
    "24/7 call answering, bilingual EN/ES, real-time appointment booking, SMS confirmations, emergency detection, full dashboard, 7 AI agents, and custom training.",
  openGraph: {
    title: "Platform — Calltide | Built for Service Businesses",
    description:
      "Everything your front office needs — in one AI receptionist that works 24/7 in English and Spanish.",
    url: "https://calltide.app/platform",
    siteName: "Calltide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform — Calltide",
    description: "24/7 AI receptionist with bilingual support, appointment booking, emergency detection, and more.",
  },
  alternates: {
    canonical: "/platform",
  },
};

export default function Page() {
  return <PlatformPage />;
}
