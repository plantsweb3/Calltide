import type { Metadata } from "next";
import { PlaybookLanding } from "./PlaybookClient";

export const metadata: Metadata = {
  title: "The Blue Collar Growth Playbook — Free Guide | Capta",
  description:
    "Free guide: How to scale your home service business without adding headcount. Revenue-per-truck metrics, missed call data by trade, the bilingual advantage, and the AI tools that actually work in 2026.",
  openGraph: {
    title: "The Blue Collar Growth Playbook — Free Download",
    description:
      "7 strategies top contractors use to grow revenue without hiring. Backed by real industry data. Free PDF — no strings attached.",
    url: "https://captahq.com/growth-playbook",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Blue Collar Growth Playbook",
    description: "Free guide: 7 strategies to scale your home service business without adding headcount.",
  },
  alternates: {
    canonical: "/growth-playbook",
  },
};

export default function Page() {
  return <PlaybookLanding />;
}
