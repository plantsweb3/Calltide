import type { Metadata } from "next";
import { PlaybookLanding } from "../../(marketing)/growth-playbook/PlaybookClient";

export const metadata: Metadata = {
  title: "El Manual de Crecimiento — Guía Gratis | Capta",
  description:
    "Guía gratuita: Cómo escalar su negocio de servicios del hogar sin contratar más personal. Métricas por camión, datos de llamadas perdidas, la ventaja bilingüe.",
  openGraph: {
    title: "El Manual de Crecimiento — Descarga Gratis",
    description: "7 estrategias que usan los mejores contratistas para crecer sin contratar. Respaldado por datos reales. PDF gratis.",
    url: "https://captahq.com/es/growth-playbook",
    siteName: "Capta",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://captahq.com/es/growth-playbook",
    languages: {
      en: "https://captahq.com/growth-playbook",
      es: "https://captahq.com/es/growth-playbook",
    },
  },
};

export default function Page() {
  return <PlaybookLanding initialLang="es" />;
}
