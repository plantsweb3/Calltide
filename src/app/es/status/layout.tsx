import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estado del Sistema | Capta",
  description: "Consulta el estado operativo actual de la plataforma de recepcionista AI de Capta.",
};

export default function StatusLayoutEs({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
