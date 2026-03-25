"use client";

/**
 * PhoneLink — renders a phone number as a tappable tel: link
 * Usage: <PhoneLink phone="+18305217133" />
 */

import { formatPhone, toTel } from "@/lib/format";

export default function PhoneLink({
  phone,
  className,
}: {
  phone: string | null | undefined;
  className?: string;
}) {
  if (!phone) return null;
  return (
    <a
      href={toTel(phone)}
      className={className ?? "font-medium hover:underline"}
      style={{ color: "var(--db-accent)" }}
    >
      {formatPhone(phone)}
    </a>
  );
}

export { formatPhone, toTel };
