import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status | Capta",
  description: "Check the current operational status of Capta's AI receptionist platform.",
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
