"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Location {
  id: string;
  name: string;
  locationName: string;
  isPrimary: boolean;
  twilioNumber: string;
  active: boolean;
}

interface LocationsData {
  accountId: string | null;
  companyName: string | null;
  currentBusinessId: string;
  locations: Location[];
}

export default function LocationSwitcher() {
  const [data, setData] = useState<LocationsData | null>(null);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard/locations")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!data) return null;

  const current = data.locations.find((l) => l.id === data.currentBusinessId);
  const currentLabel = current?.locationName ?? "Main";

  // Single location — static label, no dropdown
  if (data.locations.length <= 1) {
    return (
      <div
        className="mx-4 mb-2 rounded-lg px-3 py-2"
        style={{ background: "var(--db-hover)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
          Location
        </p>
        <p className="text-xs font-medium truncate" style={{ color: "var(--db-text-secondary)" }}>
          {currentLabel}
        </p>
      </div>
    );
  }

  async function switchTo(businessId: string) {
    if (businessId === data!.currentBusinessId || switching) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/dashboard/locations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
        // Re-fetch location data to update current
        const refreshed = await fetch("/api/dashboard/locations").then((r) => r.json());
        setData(refreshed);
      }
    } catch {
      // silently fail
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div ref={ref} className="relative mx-4 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg px-3 py-2 text-left transition-colors"
        style={{ background: "var(--db-hover)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
          Location
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium truncate" style={{ color: "var(--db-text-secondary)" }}>
            {currentLabel}
          </p>
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--db-text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg py-1 shadow-lg"
          style={{
            background: "var(--db-surface)",
            border: "1px solid var(--db-border)",
          }}
        >
          {/* All Locations aggregate link */}
          {data.locations.length > 1 && (
            <Link
              href="/dashboard/all-locations"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
              style={{ color: "var(--db-text-secondary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--db-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span>All Locations</span>
            </Link>
          )}

          {data.locations.map((loc) => {
            const isActive = loc.id === data.currentBusinessId;
            return (
              <button
                key={loc.id}
                onClick={() => switchTo(loc.id)}
                disabled={switching || isActive}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
                style={{
                  color: isActive ? "var(--db-accent)" : "var(--db-text-secondary)",
                  background: isActive ? "var(--db-hover)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--db-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: loc.active ? "#4ade80" : "#94a3b8" }} />
                <span className="truncate">{loc.locationName}</span>
                {isActive && (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="ml-auto shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* Separator + Add Location */}
          <div className="mx-2 my-1" style={{ borderTop: "1px solid var(--db-border)" }} />
          <Link
            href="/dashboard/add-location"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
            style={{ color: "var(--db-accent)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--db-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Location
          </Link>
        </div>
      )}
    </div>
  );
}
