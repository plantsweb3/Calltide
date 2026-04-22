"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { label: "Overview", segment: "" },
  { label: "Appointments", segment: "/appointments" },
  { label: "Estimates", segment: "/estimates" },
  { label: "Invoices", segment: "/invoices" },
] as const;

export function PortalShell({
  token,
  customerName,
  businessName,
  businessType,
  children,
}: {
  token: string;
  customerName: string;
  businessName: string;
  businessType: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const basePath = `/portal/${token}`;

  return (
    <div className="min-h-screen bg-gray-50 font-[var(--font-inter)]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {businessName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900 leading-tight">
                  {businessName}
                </h1>
                <p className="text-xs text-gray-500 capitalize">
                  {businessType}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Welcome, <span className="font-medium text-gray-900">{customerName}</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const href = `${basePath}${tab.segment}`;
              const isActive =
                tab.segment === ""
                  ? pathname === basePath || pathname === `${basePath}/`
                  : pathname.startsWith(href);

              return (
                <Link
                  key={tab.segment}
                  href={href}
                  className={`
                    px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${
                      isActive
                        ? "border-amber text-navy"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <a
              href="https://captahq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:text-amber-dark font-medium"
            >
              Capta
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
