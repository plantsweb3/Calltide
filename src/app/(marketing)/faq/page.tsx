import type { Metadata } from "next";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ — Calltide | AI Receptionist Questions Answered",
  description:
    "Frequently asked questions about Calltide's AI receptionist. Getting started, how Maria works, billing, technical setup, and more.",
  openGraph: {
    title: "FAQ — Calltide | Questions Answered",
    description:
      "Everything you need to know about Calltide's AI receptionist — setup, features, billing, and technical details.",
    url: "https://calltide.app/faq",
    siteName: "Calltide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — Calltide",
    description: "Frequently asked questions about Calltide's AI receptionist.",
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
                name: "What does Calltide cost?",
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
