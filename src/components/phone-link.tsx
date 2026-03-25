"use client";

/**
 * PhoneLink — renders a phone number as a tappable tel: link
 * Usage: <PhoneLink phone="+18305217133" />
 */

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function toTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("1") ? `tel:+${digits}` : `tel:+1${digits}`;
}

export default function PhoneLink({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
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
