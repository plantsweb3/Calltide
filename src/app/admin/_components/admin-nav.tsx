"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const navSections: NavSection[] = [
  {
    title: "Core",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
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
        href: "/admin/clients",
        label: "Customers",
        icon: (
          <svg {...iconProps}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        href: "/admin/calls",
        label: "Call Analytics",
        icon: (
          <svg {...iconProps}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        ),
      },
      {
        href: "/admin/billing",
        label: "Billing",
        icon: (
          <svg {...iconProps}>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        href: "/admin/ai",
        label: "AI Performance",
        icon: (
          <svg {...iconProps}>
            <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" />
            <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
            <circle cx="12" cy="14" r="4" />
            <path d="M12 18v4" />
            <path d="M8 22h8" />
          </svg>
        ),
      },
      {
        href: "/admin/prospects",
        label: "Prospects",
        icon: (
          <svg {...iconProps}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ),
      },
      {
        href: "/admin/campaigns",
        label: "Campaigns",
        icon: (
          <svg {...iconProps}>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/admin/ops",
        label: "Operations",
        icon: (
          <svg {...iconProps}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 flex h-screen w-60 flex-col"
      style={{
        background: "var(--db-surface)",
        borderRight: "1px solid var(--db-border)",
      }}
    >
      <div className="flex h-14 items-center px-6">
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
          ADMIN
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p
              className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--db-text-muted)" }}
            >
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
                    <span style={{ color: isActive ? "var(--db-accent)" : "var(--db-text-muted)" }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="px-6 py-4"
        style={{ borderTop: "1px solid var(--db-border)" }}
      >
        <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          Admin Portal
        </p>
      </div>
    </aside>
  );
}
