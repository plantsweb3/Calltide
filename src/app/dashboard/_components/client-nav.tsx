"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "◻" },
  { href: "/dashboard/calls", label: "Calls", icon: "◎" },
  { href: "/dashboard/appointments", label: "Appointments", icon: "◈" },
  { href: "/dashboard/sms", label: "SMS Log", icon: "▶" },
];

export default function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/dashboard/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex h-14 items-center px-6">
        <span className="text-lg font-bold text-green-500">Calltide</span>
        <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          PORTAL
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
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
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
