import type { Metadata } from "next";
import DesignCatalog from "./DesignCatalog";

export const metadata: Metadata = {
  title: "Design system — Capta (internal)",
  description:
    "Live catalog of brand primitives. Every component rendered with copy-paste code snippets. Read BRAND.md first.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DesignCatalog />;
}
