import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";
import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      <StaticNav lang="en" langHref="/es/legal/terms" />
      <div className="border-b" style={{ borderColor: "#E2E8F0", background: "#FBFBFC" }}>
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3 text-sm">
          <Link href="/legal/terms" className="font-medium text-charcoal-muted transition hover:text-charcoal">Terms</Link>
          <Link href="/legal/privacy" className="font-medium text-charcoal-muted transition hover:text-charcoal">Privacy</Link>
          <Link href="/legal/dpa" className="font-medium text-charcoal-muted transition hover:text-charcoal">DPA</Link>
          <Link href="/legal/sub-processors" className="font-medium text-charcoal-muted transition hover:text-charcoal">Sub-Processors</Link>
        </div>
      </div>
      {children}
      <StaticFooter lang="en" />
    </div>
  );
}
