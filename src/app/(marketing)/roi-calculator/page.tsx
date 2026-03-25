import type { Metadata } from "next";
import ROICalculatorPage from "./ROIClient";

export const metadata: Metadata = {
  title: "ROI Calculator — See How Much Capta Saves Your Business",
  description:
    "Calculate how much revenue your home service business loses to missed calls every month — and see exactly how Capta pays for itself.",
  openGraph: {
    title: "ROI Calculator | Capta",
    description:
      "Calculate how much revenue your home service business loses to missed calls and see your ROI with Capta.",
    url: "https://captahq.com/roi-calculator",
    siteName: "Capta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ROI Calculator | Capta",
    description:
      "Calculate how much revenue your home service business loses to missed calls and see your ROI with Capta.",
  },
  alternates: {
    canonical: "https://captahq.com/roi-calculator",
  },
};

export default function Page() {
  return <ROICalculatorPage />;
}
