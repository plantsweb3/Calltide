import type { Metadata } from "next";
import AboutPage from "./AboutClient";

export const metadata: Metadata = {
  title: "About — Calltide | Built in Texas for Service Businesses",
  description:
    "Calltide was built because too many great service businesses lose jobs when nobody answers the phone. AI receptionist, bilingual, 24/7.",
  openGraph: {
    title: "About — Calltide | Our Mission",
    description:
      "Every service business deserves a professional front office. Built in Texas for home service businesses everywhere.",
    url: "https://calltide.app/about",
    siteName: "Calltide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Calltide",
    description: "Built in Texas. AI receptionist for home service businesses.",
  },
};

export default function Page() {
  return <AboutPage />;
}
