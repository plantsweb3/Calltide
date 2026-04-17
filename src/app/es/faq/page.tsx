import type { Metadata } from "next";
import FAQClient from "../../(marketing)/faq/FAQClient";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes — Capta | Recepcionista IA Bilingüe",
  description:
    "Respuestas a las preguntas más comunes sobre Capta: cómo funciona, precios, configuración, integraciones y más.",
  openGraph: {
    title: "Preguntas Frecuentes — Capta",
    description: "Todo lo que necesita saber sobre su recepcionista IA bilingüe.",
    url: "https://captahq.com/es/faq",
    siteName: "Capta",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://captahq.com/es/faq",
    languages: {
      en: "https://captahq.com/faq",
      es: "https://captahq.com/es/faq",
    },
  },
};

export default function Page() {
  return <FAQClient initialLang="es" />;
}
