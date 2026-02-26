"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/admin", label: "Dashboard", icon: "◻" },
      { href: "/admin/clients", label: "Customers", icon: "◈" },
      { href: "/admin/calls", label: "Call Analytics", icon: "☎" },
      { href: "/admin/billing", label: "Billing", icon: "$" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/admin/ai", label: "AI Performance", icon: "◉" },
      { href: "/admin/prospects", label: "Prospects", icon: "◎" },
      { href: "/admin/campaigns", label: "Campaigns", icon: "▶" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/ops", label: "Operations", icon: "⚡" },
      { href: "/admin/settings", label: "Settings", icon: "⚙" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex h-14 items-center px-6">
        <span className="text-lg font-bold text-green-500">Calltide</span>
        <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          ADMIN
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-slate-800 text-slate-100 font-medium"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-6 py-4">
        <p className="text-xs text-slate-500">Phase 3 — Admin Portal</p>
      </div>
    </aside>
  );
}
