import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";
import Link from "next/link";

export default function LegalEsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      <StaticNav lang="es" langHref="/legal/terms" />
      <div className="border-b" style={{ borderColor: "#E2E8F0", background: "#FBFBFC" }}>
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3 text-sm">
          <Link href="/es/legal/terms" className="font-medium text-charcoal-muted transition hover:text-charcoal">Términos</Link>
          <Link href="/es/legal/privacy" className="font-medium text-charcoal-muted transition hover:text-charcoal">Privacidad</Link>
          <Link href="/es/legal/dpa" className="font-medium text-charcoal-muted transition hover:text-charcoal">DPA</Link>
          <Link href="/es/legal/sub-processors" className="font-medium text-charcoal-muted transition hover:text-charcoal">Sub-Procesadores</Link>
        </div>
      </div>
      {children}
      <StaticFooter lang="es" />
    </div>
  );
}
