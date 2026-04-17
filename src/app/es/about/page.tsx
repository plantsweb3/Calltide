import type { Metadata } from "next";
import AboutPage from "../../(marketing)/about/AboutClient";

export const metadata: Metadata = {
  title: "Acerca — Capta | Hecho en San Antonio para Negocios de Servicios",
  description:
    "Capta fue creado porque demasiados grandes negocios de servicios pierden trabajos por llamadas perdidas y trabajo manual. IA que contesta cada llamada Y automatiza tu oficina completa.",
  openGraph: {
    title: "Acerca — Capta | Hecho en San Antonio. Hecho para Ti.",
    description:
      "IA que contesta llamadas Y automatiza tu oficina completa. Despacho, facturación, seguimientos — todo desde tus mensajes de texto. Hecho en San Antonio.",
    url: "https://captahq.com/es/about",
    siteName: "Capta",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://captahq.com/es/about",
    languages: {
      en: "https://captahq.com/about",
      es: "https://captahq.com/es/about",
    },
  },
};

export default function Page() {
  return <AboutPage initialLang="es" />;
}
