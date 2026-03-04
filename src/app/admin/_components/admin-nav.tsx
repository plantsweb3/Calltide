"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const ip = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export default function AdminNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [badgeCount, setBadgeCount] = useState(0);
  const [liveCallCount, setLiveCallCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications/count")
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => setBadgeCount(d.count))
      .catch(() => setBadgeCount(0));
  }, []);

  // Poll active call count every 10s for the sidebar badge
  useEffect(() => {
    const fetchLive = () =>
      fetch("/api/admin/live")
        .then((r) => (r.ok ? r.json() : { activeCount: 0 }))
        .then((d) => setLiveCallCount(d.activeCount ?? 0))
        .catch(() => setLiveCallCount(0));
    fetchLive();
    const t = setInterval(fetchLive, 10000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const navSections: NavSection[] = [
    {
      items: [
        { href: "/admin", label: "Mission Control", icon: <svg {...ip}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
        { href: "/admin/live", label: "Live Monitor", badge: liveCallCount, badgeColor: "#22c55e", icon: <svg {...ip}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="currentColor" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg> },
      ],
    },
    {
      title: "Clients",
      items: [
        { href: "/admin/clients", label: "Clients", icon: <svg {...ip}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { href: "/admin/onboarding-pipeline", label: "Onboarding", icon: <svg {...ip}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14l2 2 4-4" /></svg> },
        { href: "/admin/calls", label: "Calls", icon: <svg {...ip}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg> },
        { href: "/admin/ai", label: "AI Performance", icon: <svg {...ip}><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" /><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" /><circle cx="12" cy="14" r="4" /><path d="M12 18v4" /><path d="M8 22h8" /></svg> },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/admin/agents", label: "Agents", icon: <svg {...ip}><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.17A7 7 0 0 1 14 23h-4a7 7 0 0 1-6.83-4H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z" /><circle cx="9" cy="15" r="1" /><circle cx="15" cy="15" r="1" /></svg> },
        { href: "/admin/client-success", label: "Client Success", icon: <svg {...ip}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
        { href: "/admin/feedback", label: "Feedback", icon: <svg {...ip}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg> },
        { href: "/admin/billing", label: "Billing & Revenue", icon: <svg {...ip}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
        { href: "/admin/financials", label: "Financials", icon: <svg {...ip}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
        { href: "/admin/capacity", label: "Capacity", icon: <svg {...ip}><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
        { href: "/admin/ops", label: "Service Health", icon: <svg {...ip}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
        { href: "/admin/outbound", label: "Outbound Calls", icon: <svg {...ip}><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94" /><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg> },
      ],
    },
    {
      title: "Growth",
      items: [
        { href: "/admin/demos", label: "Demo Analytics", icon: <svg {...ip}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg> },
        { href: "/admin/prospects", label: "Prospects", icon: <svg {...ip}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
        { href: "/admin/campaigns", label: "Campaigns", icon: <svg {...ip}><polygon points="5 3 19 12 5 21 5 3" /></svg> },
        { href: "/admin/marketing", label: "Marketing", icon: <svg {...ip}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg> },
        { href: "/admin/blog", label: "Blog", icon: <svg {...ip}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
        { href: "/admin/knowledge-base", label: "Knowledge Base", icon: <svg {...ip}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
      ],
    },
    {
      title: "Compliance",
      items: [
        { href: "/admin/compliance", label: "Legal", icon: <svg {...ip}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
        { href: "/admin/incidents", label: "Incidents", icon: <svg {...ip}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> },
        { href: "/admin/compliance/dsar", label: "DSAR", icon: <svg {...ip}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg> },
      ],
    },
  ];

  const footerItems: NavItem[] = [
    {
      href: "/admin/notifications",
      label: "Notifications",
      badge: badgeCount,
      icon: <svg {...ip}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
    },
    { href: "/admin/settings", label: "Settings", icon: <svg {...ip}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
  ];

  function renderLink(item: NavItem) {
    const isActive =
      item.href === "/admin"
        ? pathname === "/admin"
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
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--db-hover)"; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ color: isActive ? "var(--db-accent)" : "var(--db-text-muted)" }}>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
            style={{ background: item.badgeColor ?? "#ef4444", color: "#fff", minWidth: 18, textAlign: "center" }}
          >
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col transition-transform duration-300 lg:translate-x-0 ${
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
            <span className="text-lg font-bold" style={{ color: "var(--db-accent)" }}>Calltide</span>
            <span
              className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
            >
              ADMIN
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 lg:hidden"
            style={{ color: "var(--db-text-muted)" }}
            aria-label="Close menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navSections.map((section, i) => (
            <div key={section.title ?? i} className="mb-3">
              {section.title && (
                <p
                  className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--db-text-muted)" }}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(renderLink)}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-2 space-y-0.5" style={{ borderTop: "1px solid var(--db-border)" }}>
          {footerItems.map(renderLink)}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: "#f87171" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg {...ip}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
