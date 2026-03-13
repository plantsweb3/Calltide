import type { Metadata } from "next";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ — Capta | AI Front Office Questions Answered",
  description:
    "Frequently asked questions about Capta's AI front office. Getting started, features, AI estimates, missed call recovery, billing, and more.",
  openGraph: {
    title: "FAQ — Capta | Questions Answered",
    description:
      "Everything you need to know about Capta's AI front office — setup, features, estimates, follow-ups, billing, and technical details.",
    url: "https://captahq.com/faq",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — Capta",
    description: "Frequently asked questions about Capta's AI front office.",
  },
  alternates: {
    canonical: "/faq",
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
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Will my callers know they're talking to AI?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Your receptionist is designed to sound natural and warm — like someone who's worked at your business for years. Most callers don't notice.",
                },
              },
              {
                "@type": "Question",
                name: "How long does setup take?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Most businesses are fully set up in under 10 minutes. Name your receptionist, customize her greeting, forward your number, and you're live.",
                },
              },
              {
                "@type": "Question",
                name: "What does Capta cost?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "One plan at $497/month (or $4,764/year). Everything included — unlimited calls, bilingual support, booking, CRM, analytics, compliance. No per-minute charges.",
                },
              },
            ],
          }),
        }}
      />
      <FAQClient />
    </>
  );
}
