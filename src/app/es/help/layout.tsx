import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";

export default function HelpEsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      <StaticNav lang="es" langHref="/help" />
      {children}
      <StaticFooter lang="es" />
    </div>
  );
}
