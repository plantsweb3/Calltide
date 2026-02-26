"use client";

import Link from "next/link";

const actions = [
  { href: "/admin/clients", label: "View Clients", icon: "◈" },
  { href: "/admin/calls", label: "Call Analytics", icon: "☎" },
  { href: "/admin/billing", label: "Billing", icon: "$" },
  { href: "/admin/ai", label: "AI Performance", icon: "◉" },
  { href: "/admin/ops", label: "System Ops", icon: "⚡" },
  { href: "/admin/prospects", label: "Prospects", icon: "◎" },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100"
        >
          <span>{action.icon}</span>
          {action.label}
        </Link>
      ))}
    </div>
  );
}
