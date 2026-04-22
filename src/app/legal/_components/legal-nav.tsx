"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/legal/terms", label: "Terms of Service", labelEs: "Términos" },
  { href: "/legal/privacy", label: "Privacy Policy", labelEs: "Privacidad" },
  { href: "/legal/dpa", label: "DPA", labelEs: "DPA" },
  { href: "/legal/sub-processors", label: "Sub-Processors", labelEs: "Sub-Procesadores" },
];

export function LegalNav({ lang = "en" }: { lang?: "en" | "es" }) {
  const pathname = usePathname();
  const prefix = lang === "es" ? "/es" : "";

  return (
    <div className="border-b" style={{ borderColor: "#E2E8F0", background: "white" }}>
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-0 text-sm">
        {LINKS.map((link) => {
          const href = `${prefix}${link.href}`;
          const isActive = pathname === href;
          return (
            <Link
              key={link.href}
              href={href}
              className="relative whitespace-nowrap px-4 py-3.5 font-medium transition-colors"
              style={{
                color: isActive ? "#D4A843" : "#64748B",
              }}
            >
              {lang === "es" ? link.labelEs : link.label}
              {isActive && (
                <span
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full"
                  style={{ background: "#D4A843" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
