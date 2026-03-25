/**
 * Shared formatting utilities for the Capta dashboard.
 */

/** Format a phone number for display: (830) 521-7133 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/** Build a tel: URI from a phone string */
export function toTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("1") ? `tel:+${digits}` : `tel:+1${digits}`;
}

/** Format an ISO date string. Defaults to "Mar 25, 2026" style. */
export function formatDate(
  iso: string | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", opts ?? {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Short date: "Mar 25" */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Relative time: "2h ago", "3d ago", "just now" */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDateShort(iso);
  } catch {
    return iso;
  }
}

/** Format cents as currency: 49700 → "$497.00" */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
