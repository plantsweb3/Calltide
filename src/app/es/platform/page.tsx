import type { Metadata } from "next";
import PlatformClient from "../../(marketing)/platform/PlatformClient";

export const metadata: Metadata = {
  title: "Plataforma — Capta | Recepcionista IA Bilingüe para Servicios del Hogar",
  description:
    "Descubra cómo Capta contesta llamadas, agenda citas, genera presupuestos, y automatiza seguimientos — todo desde sus mensajes de texto.",
  openGraph: {
    title: "Plataforma — Capta",
    description: "Contesta llamadas, agenda citas, genera presupuestos. Bilingüe, 24/7.",
    url: "https://captahq.com/es/platform",
    siteName: "Capta",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://captahq.com/es/platform",
    languages: {
      en: "https://captahq.com/platform",
      es: "https://captahq.com/es/platform",
    },
  },
};

export default function Page() {
  return <PlatformClient initialLang="es" />;
}
