"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./theme-provider";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "◻" },
  { href: "/dashboard/calls", label: "Calls", icon: "◎" },
  { href: "/dashboard/appointments", label: "Appointments", icon: "◈" },
  { href: "/dashboard/sms", label: "SMS Log", icon: "▶" },
];

interface ClientNavProps {
  open: boolean;
  onClose: () => void;
}

export default function ClientNav({ open, onClose }: ClientNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    await fetch("/api/dashboard/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--db-surface)",
          borderRight: "1px solid var(--db-border)",
        }}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center">
            <span className="text-lg font-bold" style={{ color: "var(--db-accent)" }}>
              Calltide
            </span>
            <span
              className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                background: "var(--db-hover)",
                color: "var(--db-text-muted)",
              }}
            >
              PORTAL
            </span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1 md:hidden"
            style={{ color: "var(--db-text-muted)" }}
            aria-label="Close menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>

        {/* AI Status */}
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#4ade80" }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "#4ade80" }} />
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--db-text-secondary)" }}>
            AI Receptionist Active
          </span>
        </div>

        {/* Navigation */}
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
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  background: isActive ? "var(--db-hover)" : "transparent",
                  color: isActive ? "var(--db-text)" : "var(--db-text-muted)",
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--db-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + Logout */}
        <div
          className="px-3 py-4 space-y-1"
          style={{ borderTop: "1px solid var(--db-border)" }}
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: "var(--db-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--db-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: "var(--db-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--db-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
