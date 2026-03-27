"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./theme-provider";
import LocationSwitcher from "./location-switcher";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

interface NavItem {
  href: string;
  labelKey: string; // i18n key from strings.ts
  tourId?: string;
  icon: React.ReactNode;
}

// Primary nav items — always visible (optimized for solo contractors)
const primaryNavItems: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/calls",
    labelKey: "nav.calls",
    tourId: "calls-link",
    icon: <svg {...iconProps}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  },
  {
    href: "/dashboard/appointments",
    labelKey: "nav.appointments",
    icon: <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  },
  {
    href: "/dashboard/follow-ups",
    labelKey: "followUps.title",
    icon: <svg {...iconProps}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  },
  {
    href: "/dashboard/customers",
    labelKey: "nav.customers",
    tourId: "crm-link",
    icon: <svg {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  },
  {
    href: "/dashboard/invoices",
    labelKey: "invoices.title",
    icon: <svg {...iconProps}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  },
  {
    href: "/dashboard/settings",
    labelKey: "nav.settings",
    tourId: "settings-link",
    icon: <svg {...iconProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  },
];

// "More" section — collapsed by default
const moreNavItems: NavItem[] = [
  {
    href: "/dashboard/sms",
    labelKey: "nav.sms",
    icon: <svg {...iconProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
  {
    href: "/dashboard/estimates",
    labelKey: "nav.estimates",
    icon: <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  },
  {
    href: "/dashboard/dispatch",
    labelKey: "dispatch.title",
    icon: <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  },
  {
    href: "/dashboard/team",
    labelKey: "team.title",
    icon: <svg {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>,
  },
  {
    href: "/dashboard/job-cards",
    labelKey: "nav.jobCards",
    icon: <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M13 8h5" /><path d="M13 12h5" /><path d="M13 16h5" /></svg>,
  },
  {
    href: "/dashboard/intelligence",
    labelKey: "nav.intelligence",
    icon: <svg {...iconProps}><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><line x1="9" y1="21" x2="15" y2="21" /></svg>,
  },
  {
    href: "/dashboard/reporting",
    labelKey: "nav.reporting",
    icon: <svg {...iconProps}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  {
    href: "/dashboard/billing",
    labelKey: "nav.billing",
    icon: <svg {...iconProps}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  },
  {
    href: "/dashboard/feedback",
    labelKey: "nav.feedback",
    icon: <svg {...iconProps}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  },
  {
    href: "/dashboard/referrals",
    labelKey: "nav.referrals",
    icon: <svg {...iconProps}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
  },
  {
    href: "/dashboard/partners",
    labelKey: "nav.partners",
    icon: <svg {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  },
  {
    href: "/dashboard/import",
    labelKey: "nav.import",
    icon: <svg {...iconProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  },
];

interface ClientNavProps {
  open: boolean;
  onClose: () => void;
}

interface NavBadges {
  followUps: number;
  dispatch: number;
  invoices: number;
}

const BADGE_HREF_MAP: Record<keyof NavBadges, string> = {
  followUps: "/dashboard/follow-ups",
  dispatch: "/dashboard/dispatch",
  invoices: "/dashboard/invoices",
};

function NavLink({ item, pathname, badges, onClose, lang }: { item: NavItem; pathname: string; badges: NavBadges; onClose: () => void; lang: "en" | "es" }) {
  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

  const badgeEntry = (Object.entries(BADGE_HREF_MAP) as [keyof NavBadges, string][]).find(([, href]) => href === item.href);
  const badgeCount = badgeEntry ? badges[badgeEntry[0]] : 0;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      {...(item.tourId ? { "data-tour": item.tourId } : {})}
      className="db-hover-bg flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
      style={{
        background: isActive ? "var(--sidebar-active-bg)" : "transparent",
        color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
        fontWeight: isActive ? 500 : 400,
      }}
    >
      <span className="relative" style={{ color: isActive ? "var(--sidebar-accent)" : "var(--sidebar-text)" }}>
        {item.icon}
        {badgeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full text-[9px] font-bold leading-none"
            style={{ background: "var(--db-danger)", color: "white", minWidth: "16px", height: "16px", padding: "0 4px" }}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </span>
      {t(item.labelKey, lang)}
    </Link>
  );
}

export default function ClientNav({ open, onClose }: ClientNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [lang] = useLang();
  const [aiStatus, setAiStatus] = useState<string>("active");
  const [badges, setBadges] = useState<NavBadges>({ followUps: 0, dispatch: 0, invoices: 0 });
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-expand "More" if current page is in the More section
  useEffect(() => {
    if (moreNavItems.some((item) => pathname.startsWith(item.href) && item.href !== "/dashboard")) {
      setMoreOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    fetch("/api/dashboard/billing")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setAiStatus(d.status ?? "active"))
      .catch(() => setAiStatus("active"));
  }, []);

  // Fetch nav badge counts and poll every 60 seconds
  useEffect(() => {
    function fetchBadges() {
      fetch("/api/dashboard/nav-badges")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d: NavBadges) => setBadges(d))
        .catch(() => {});
    }
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig: Record<string, { color: string; pulse: boolean; labelKey: string }> = {
    active: { color: "var(--db-success)", pulse: true, labelKey: lang === "es" ? "Recepcionista AI activa" : "AI Receptionist Active" },
    past_due: { color: "var(--db-warning)", pulse: false, labelKey: lang === "es" ? "Recepcionista AI activa" : "AI Receptionist Active" },
    grace_period: { color: "var(--db-warning-alt)", pulse: false, labelKey: lang === "es" ? "Pago atrasado" : "Payment Overdue" },
    suspended: { color: "var(--db-danger)", pulse: false, labelKey: lang === "es" ? "Servicio suspendido" : "Service Suspended" },
    canceled: { color: "var(--db-text-muted)", pulse: false, labelKey: lang === "es" ? "Servicio cancelado" : "Service Canceled" },
  };
  const sc = statusConfig[aiStatus] ?? statusConfig.active;

  async function handleLogout() {
    await fetch("/api/dashboard/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  return (
    <>
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
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex h-14 items-center justify-between px-5"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <img src="/images/logo-inline-white.webp" alt="Capta" className="h-6 w-auto" />
          <button
            onClick={onClose}
            className="rounded-lg p-1 md:hidden"
            style={{ color: "var(--sidebar-text)" }}
            aria-label="Close menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>

        {/* Location Switcher */}
        <LocationSwitcher />

        {/* AI Status */}
        <div
          className="mx-3 mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2"
          style={{ background: "var(--sidebar-hover)" }}
        >
          <span className="relative flex h-2 w-2">
            {sc.pulse && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: sc.color }} />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: sc.color }} />
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--sidebar-text)" }}>
            {sc.labelKey}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {/* Primary items */}
          <div className="space-y-0.5">
            {primaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} badges={badges} onClose={onClose} lang={lang} />
            ))}
          </div>

          {/* More section */}
          <div className="mt-4">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--sidebar-section)" }}
            >
              <span>{lang === "es" ? "Más" : "More"}</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="transition-transform duration-200"
                style={{ transform: moreOpen ? "rotate(180deg)" : "rotate(0)" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {moreOpen && (
              <div className="mt-0.5 space-y-0.5">
                {moreNavItems.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} badges={badges} onClose={onClose} lang={lang} />
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-3 space-y-0.5"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <Link
            href="/help"
            target="_blank"
            onClick={onClose}
            className="db-hover-bg flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            style={{ color: "var(--sidebar-text)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {lang === "es" ? "Centro de ayuda" : "Help Center"}
          </Link>

          <button
            onClick={toggleTheme}
            className="db-hover-bg flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            style={{ color: "var(--sidebar-text)" }}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {theme === "dark" ? (lang === "es" ? "Modo claro" : "Light Mode") : (lang === "es" ? "Modo oscuro" : "Dark Mode")}
          </button>

          <button
            onClick={handleLogout}
            className="db-hover-bg flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            style={{ color: "var(--sidebar-text)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t("action.signOut", lang)}
          </button>
        </div>
      </aside>
    </>
  );
}
