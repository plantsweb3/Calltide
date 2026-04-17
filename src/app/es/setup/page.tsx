import type { Metadata } from "next";
import SetupClient from "../../setup/SetupClient";

export const metadata: Metadata = {
  title: "Contrata a tu Recepcionista IA | Capta",
  description:
    "Configure su recepcionista IA bilingüe en minutos. Contesta llamadas, agenda citas, y nunca pierde un prospecto — en inglés y español.",
  openGraph: {
    title: "Contrata a tu Recepcionista IA | Capta",
    description:
      "Configure su recepcionista IA bilingüe en minutos. Contesta llamadas, agenda citas, nunca pierde un prospecto.",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://captahq.com/es/setup",
    languages: {
      en: "https://captahq.com/setup",
      es: "https://captahq.com/es/setup",
    },
  },
};

export default function Page() {
  return <SetupClient initialLang="es" />;
}
