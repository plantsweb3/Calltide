import type { Metadata } from "next";
import EsHomepage from "./EsHomeClient";

export const metadata: Metadata = {
  title: "Capta — Recepcionista IA para Negocios de Servicios del Hogar | Bilingüe EN/ES",
  description:
    "Capta contesta cada llamada a tu negocio en inglés y español, 24/7. Agenda citas, detecta emergencias, y envía confirmaciones por SMS. Garantía de 30 días.",
  openGraph: {
    title: "Capta — Cada Llamada Contestada. Cada Trabajo Reservado.",
    description:
      "Recepcionista IA bilingüe para negocios de servicios del hogar. Contesta llamadas, agenda citas, detecta emergencias. 24/7.",
    url: "https://capta.app/es",
    siteName: "Capta",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Capta — Cada Llamada Contestada. Cada Trabajo Reservado.",
    description: "Recepcionista IA bilingüe. 24/7. Garantía de 30 días.",
  },
  alternates: {
    canonical: "https://capta.app/es",
    languages: { en: "https://capta.app", es: "https://capta.app/es" },
  },
};

export default function Page() {
  return <EsHomepage />;
}
