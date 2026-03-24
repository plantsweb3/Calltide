/**
 * Quiet Hours enforcement for owner notifications.
 * Checks whether the current time falls within the owner's configured
 * quiet window, respecting the business timezone.
 */

interface BusinessQuietHours {
  ownerQuietHoursStart: string | null; // "21:00"
  ownerQuietHoursEnd: string | null;   // "08:00"
  timezone: string;                     // "America/Chicago"
}

/**
 * Returns true if the owner is currently in quiet hours.
 * Handles midnight-crossing windows (e.g. 21:00 - 08:00).
 * Returns false if quiet hours are not configured.
 */
export function isOwnerInQuietHours(business: BusinessQuietHours): boolean {
  const start = business.ownerQuietHoursStart;
  const end = business.ownerQuietHoursEnd;

  if (!start || !end) return false;

  // Parse HH:MM to minutes since midnight
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Get current time in business timezone
  const now = new Date();
  const localTime = new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const currentH = parseInt(localTime.find((p) => p.type === "hour")?.value ?? "0");
  const currentM = parseInt(localTime.find((p) => p.type === "minute")?.value ?? "0");
  const currentMinutes = currentH * 60 + currentM;

  if (startMinutes <= endMinutes) {
    // Same-day window (e.g. 13:00 - 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Midnight-crossing window (e.g. 21:00 - 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
