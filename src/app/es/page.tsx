import type { Metadata } from "next";
import EsHomepage from "./EsHomeClient";

export const metadata: Metadata = {
  title: "Calltide — Recepcionista IA para Negocios de Servicios del Hogar | Bilingüe EN/ES",
  description:
    "Calltide contesta cada llamada a tu negocio en inglés y español, 24/7. Agenda citas, detecta emergencias, y envía confirmaciones por SMS. Prueba gratis por 14 días.",
  openGraph: {
    title: "Calltide — Cada Llamada Contestada. Cada Trabajo Reservado.",
    description:
      "Recepcionista IA bilingüe para negocios de servicios del hogar. Contesta llamadas, agenda citas, detecta emergencias. 24/7.",
    url: "https://calltide.app/es",
    siteName: "Calltide",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calltide — Cada Llamada Contestada. Cada Trabajo Reservado.",
    description: "Recepcionista IA bilingüe. 24/7. Prueba gratis.",
  },
  alternates: {
    canonical: "https://calltide.app/es",
    languages: { en: "https://calltide.app", es: "https://calltide.app/es" },
  },
};

export default function Page() {
  return <EsHomepage />;
}
