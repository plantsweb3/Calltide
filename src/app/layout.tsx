import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Calltide — AI Receptionist for Home Service Businesses | Bilingual EN/ES",
  description:
    "Maria answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies. Built for HVAC, plumbing, and electrical businesses. $497/mo.",
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
      "Maria answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies. Built for home service businesses. $497/mo.",
    url: "https://calltide.app",
    siteName: "Calltide",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://calltide.app/images/og.png",
        width: 1200,
        height: 630,
        alt: "Calltide — AI Receptionist for Home Service Businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calltide — Every Call Answered. Every Job Booked.",
    description:
      "Maria answers your calls 24/7 in English and Spanish. Book appointments, take messages, detect emergencies. $497/mo.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
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
