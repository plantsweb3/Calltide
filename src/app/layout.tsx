import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { TrackingScripts } from "@/components/tracking/TrackingScripts";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app"),
  title: "Calltide — AI Receptionist for Home Service Businesses | Bilingual EN/ES",
  description:
    "AI receptionist that answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies. Built for HVAC, plumbing, and electrical businesses.",
  keywords: [
    "AI receptionist",
    "virtual receptionist",
    "bilingual receptionist",
    "home service business",
    "HVAC answering service",
    "plumbing answering service",
    "electrical answering service",
    "Spanish answering service",
    "24/7 phone answering",
    "AI phone agent",
    "missed call solution",
    "appointment booking AI",
  ],
  openGraph: {
    title: "Calltide — Every Call Answered. Every Job Booked.",
    description:
      "AI receptionist that answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies. Built for home service businesses.",
    url: "https://calltide.app",
    siteName: "Calltide",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Calltide — AI Receptionist for Home Service Businesses" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calltide — Every Call Answered. Every Job Booked.",
    description:
      "AI receptionist that answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies.",
  },
  alternates: {
    canonical: "/",
    languages: { en: "/", es: "/es" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Calltide",
              url: "https://calltide.app",
              logo: "https://calltide.app/icon.png",
              description:
                "AI-powered bilingual receptionist platform for home service businesses. Answers calls 24/7 in English and Spanish.",
              foundingDate: "2025",
              founder: {
                "@type": "Person",
                name: "Ulysses Munoz",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+1-830-521-7133",
                contactType: "sales",
                availableLanguage: ["English", "Spanish"],
              },
              sameAs: [],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
        <TrackingScripts />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--db-card, #1e293b)",
              border: "1px solid var(--db-border, #334155)",
              color: "var(--db-text, #f1f5f9)",
            },
          }}
        />
      </body>
    </html>
  );
}
