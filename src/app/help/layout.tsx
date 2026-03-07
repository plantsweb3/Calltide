import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      <StaticNav lang="en" langHref="/es/help" />
      {children}
      <StaticFooter lang="en" />
    </div>
  );
}
