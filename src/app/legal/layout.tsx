import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";
import { LegalNav } from "./_components/legal-nav";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      <StaticNav lang="en" langHref="/es/legal/terms" />
      <LegalNav lang="en" />
      {children}
      <StaticFooter lang="en" />
    </div>
  );
}
