import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";
import { LegalNav } from "../../legal/_components/legal-nav";

export default function LegalEsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      <StaticNav lang="es" langHref="/legal/terms" />
      <LegalNav lang="es" />
      {children}
      <StaticFooter lang="es" />
    </div>
  );
}
