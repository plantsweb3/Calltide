import type { Metadata } from "next";
import PricingClient from "../../(marketing)/pricing/PricingClient";

export const metadata: Metadata = {
  title: "Precios — Capta | $497/mes para Recepcionista IA Bilingüe 24/7",
  description:
    "Un plan. $497/mes o $4,764/año. Todas las funciones incluidas. Prueba gratis de 14 días. Sin tarifas ocultas.",
  openGraph: {
    title: "Precios — Capta",
    description: "Un plan, todas las funciones. $497/mes. Prueba gratis por 14 días.",
    url: "https://captahq.com/es/pricing",
    siteName: "Capta",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://captahq.com/es/pricing",
    languages: {
      en: "https://captahq.com/pricing",
      es: "https://captahq.com/es/pricing",
    },
  },
};

export default function Page() {
  return <PricingClient initialLang="es" />;
}
