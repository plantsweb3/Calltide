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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does Capta cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Capta costs $497 per month with unlimited calls, or $397 per month on an annual plan ($4,764 per year). Bilingual English and Spanish answering is included at no extra cost. There are no setup fees, no per-call charges, and no hidden costs.",
      },
    },
    {
      "@type": "Question",
      name: "Does Capta speak Spanish?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Maria, Capta's AI receptionist, is natively bilingual in English and Spanish. She automatically detects the caller's language and responds fluently. This is not a translation layer — Maria speaks natural, colloquial Spanish and English.",
      },
    },
    {
      "@type": "Question",
      name: "How long does setup take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "About 5 to 10 minutes. Capta has an 8-step onboarding wizard that walks you through entering your business info, setting your hours, and forwarding your calls. Maria starts answering immediately after setup.",
      },
    },
    {
      "@type": "Question",
      name: "What types of businesses use Capta?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Capta is built for home service contractors including plumbers, HVAC technicians, electricians, landscapers, roofers, painters, general contractors, and pest control companies. Any business that misses calls while working on job sites benefits from Maria.",
      },
    },
    {
      "@type": "Question",
      name: "Will my callers know they're talking to AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your receptionist is designed to sound natural and warm — like someone who's worked at your business for years. She uses natural speech patterns, handles interruptions, and adapts her tone to the caller. Most callers don't notice.",
      },
    },
    {
      "@type": "Question",
      name: "How does Capta compare to Smith.ai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Capta offers unlimited calls at a flat $497/month with native bilingual support included. Smith.ai starts at $97/month for 30 AI calls with per-call pricing that adds up quickly — 200 calls/month costs $820+. Smith.ai charges extra for bilingual support. Capta also includes a built-in CRM, appointment booking with SMS confirmations, and emergency detection.",
      },
    },
    {
      "@type": "Question",
      name: "How does Capta compare to Ruby Receptionists?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ruby uses human receptionists billed per-minute starting at $245/month for 50 minutes (~15 calls). At 200 calls per month, Ruby costs $1,640+. Capta costs $497/month for unlimited calls. Ruby has limited bilingual availability and limited hours. Capta's Maria is natively bilingual and works 24/7.",
      },
    },
    {
      "@type": "Question",
      name: "How does Capta compare to hiring a human receptionist?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A full-time receptionist costs $35,000 to $45,000 per year plus benefits, only works 40 hours per week, takes vacations, and calls in sick. Maria costs $497/month ($5,964/year), works 24/7/365, never misses a day, speaks two languages, and handles unlimited simultaneous calls.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if there's an emergency call?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Maria detects emergency keywords like gas leak, burst pipe, flooding, or fire and immediately transfers the call to your designated emergency contact number. She also sends you an SMS alert. You set the rules for what qualifies as an emergency.",
      },
    },
    {
      "@type": "Question",
      name: "Does Maria actually book appointments?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Maria books appointments in real-time based on your availability calendar. Callers get an instant SMS confirmation with the appointment details. Appointments sync to Google Calendar automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Do I keep my existing phone number?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You set up call forwarding from your current business number to Capta. Your customers call the same number they always have — they just notice someone always picks up now.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize what Maria says?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You choose her name, personality (professional, friendly, or warm), greeting, and train her with custom responses for your specific services. She'll learn your business hours, service area, pricing ranges, and how you want different situations handled.",
      },
    },
    {
      "@type": "Question",
      name: "What if a caller hangs up before completing the call?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Maria auto-texts them within 60 seconds with a friendly message and a link to continue the conversation. Most callers re-engage, recovering jobs that would otherwise go to a competitor.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Capta uses encryption in transit and at rest, complies with TCPA regulations, and follows data privacy best practices. Your data is never shared or sold. Full details are in our Privacy Policy and Data Processing Agreement.",
      },
    },
    {
      "@type": "Question",
      name: "Can Maria handle multiple calls at the same time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Unlike a human receptionist who can only take one call at a time, Maria handles unlimited simultaneous calls. No busy signals, no hold music, no missed calls.",
      },
    },
    {
      "@type": "Question",
      name: "What if I want to cancel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cancel anytime from your dashboard. No contracts, no cancellation fees, no phone calls required. Your account stays active until the end of your billing period. Both plans come with a 30-day money-back guarantee.",
      },
    },
    {
      "@type": "Question",
      name: "Can Maria generate estimates?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. She collects job details during the call — problem type, property info, urgency — then generates a price range based on your pricing rules. The estimate is texted to you for one-tap approval before being sent to the customer.",
      },
    },
    {
      "@type": "Question",
      name: "Does Capta work after hours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Maria works 24/7/365. After-hours calls are actually some of the most valuable — emergency plumbing at 2 AM, AC failures on weekends, heating emergencies on holidays. Maria catches all of them.",
      },
    },
    {
      "@type": "Question",
      name: "What CRM features are included?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Capta automatically builds customer profiles from every call — name, phone, address, service requested, call history, and notes. Zero manual data entry. You can also import existing contacts via CSV. The built-in CRM includes lead tracking, appointment management, and job cards.",
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient />
    </>
  );
}
