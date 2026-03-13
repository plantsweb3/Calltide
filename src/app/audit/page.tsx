import type { Metadata } from "next";
import AuditPage from "./AuditClient";

export const metadata: Metadata = {
  title: "Free Business Audit — Capta | See What Callers Experience",
  description:
    "We'll call your business right now and show you exactly what your customers experience. Free audit for HVAC, plumbing, and electrical businesses. No strings attached.",
  openGraph: {
    title: "Free Business Audit — Capta",
    description:
      "We call your business and show you what callers experience. Free for home service businesses.",
    url: "https://captahq.com/audit",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Audit — Capta",
    description:
      "We call your business and show you what callers experience. Free, no strings attached.",
  },
  alternates: {
    canonical: "/audit",
  },
};

export default function Page() {
  return <AuditPage />;
}
