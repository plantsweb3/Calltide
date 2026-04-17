import type { Metadata } from "next";
import ROICalculatorPage from "../../(marketing)/roi-calculator/ROIClient";

export const metadata: Metadata = {
  title: "Calculadora de ROI — Capta | Cuánto Cuestan las Llamadas Perdidas",
  description:
    "Calcule cuánto dinero está perdiendo por llamadas no contestadas. Vea cuánto trabajo adicional podría cerrar con una recepcionista IA bilingüe 24/7.",
  openGraph: {
    title: "Calculadora de ROI — Capta",
    description: "Calcule las llamadas perdidas y los ingresos que podría recuperar con Capta.",
    url: "https://captahq.com/es/roi-calculator",
    siteName: "Capta",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://captahq.com/es/roi-calculator",
    languages: {
      en: "https://captahq.com/roi-calculator",
      es: "https://captahq.com/es/roi-calculator",
    },
  },
};

export default function Page() {
  return <ROICalculatorPage initialLang="es" />;
}
