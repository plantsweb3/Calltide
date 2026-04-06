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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  title: "Capta — AI Receptionist for Home Service Businesses | Bilingual EN/ES",
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
    title: "Capta — Every Call Answered. Every Job Booked.",
    description:
      "AI receptionist that answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies. Built for home service businesses.",
    url: "https://captahq.com",
    siteName: "Capta",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Capta — AI Receptionist for Home Service Businesses" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Capta — Every Call Answered. Every Job Booked.",
    description:
      "AI receptionist that answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies.",
  },
  alternates: {
    canonical: "/",
    languages: { en: "/", es: "/es", "x-default": "/" },
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
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}
        <link rel="alternate" type="application/rss+xml" title="Capta Blog" href="/blog/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Capta Blog — Español" href="/es/blog/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Capta",
              url: "https://captahq.com",
              inLanguage: ["en", "es"],
              potentialAction: {
                "@type": "SearchAction",
                target: "https://captahq.com/blog?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Capta",
              url: "https://captahq.com",
              logo: "https://captahq.com/icon-512.png",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Capta",
              alternateName: "Maria AI Receptionist",
              description:
                "AI receptionist that answers every business call 24/7 in English and Spanish. Built for home service contractors. Unlimited calls for $497/month.",
              url: "https://captahq.com",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "397",
                highPrice: "497",
                priceCurrency: "USD",
                offerCount: "2",
              },
              featureList: [
                "24/7 AI call answering",
                "Bilingual English and Spanish",
                "Appointment booking with SMS confirmations",
                "Built-in CRM with zero data entry",
                "Emergency detection and live transfer",
                "Call analytics dashboard",
                "NPS surveys and referral program",
                "14-day free trial",
              ],
              screenshot: "https://captahq.com/opengraph-image",
              creator: {
                "@type": "Organization",
                name: "Capta",
                url: "https://captahq.com",
                founder: {
                  "@type": "Person",
                  name: "Ulysses Munoz",
                },
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "San Antonio",
                  addressRegion: "TX",
                  addressCountry: "US",
                },
              },
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
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: "13px",
              borderRadius: "var(--radius-lg, 12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            },
            classNames: {
              success: "toast-success",
              error: "toast-error",
              warning: "toast-warning",
              info: "toast-info",
            },
          }}
        />
      </body>
    </html>
  );
}
