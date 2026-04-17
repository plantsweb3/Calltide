import type { Metadata } from "next";
import SetupClient from "./SetupClient";

export const metadata: Metadata = {
  title: "Hire Your AI Receptionist | Capta",
  description:
    "Set up your bilingual AI receptionist in minutes. Capta will answer calls, book appointments, and never miss a lead — in English and Spanish.",
  openGraph: {
    title: "Hire Your AI Receptionist | Capta",
    description:
      "Set up your bilingual AI receptionist in minutes. Capta will answer calls, book appointments, and never miss a lead.",
    type: "website",
  },
};

export default function SetupPage() {
  return <SetupClient />;
}
