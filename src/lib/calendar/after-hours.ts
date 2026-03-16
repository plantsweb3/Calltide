type BusinessHours = Record<string, { open: string; close: string; closed?: boolean }>;

/**
 * Determine if a given timestamp falls outside business hours.
 * Used by weekly digests, monthly ROI reports, and the CLM route.
 *
 * @param callCreatedAt - ISO timestamp of the call
 * @param businessHours - Business hours keyed by day name (short format e.g. "Mon" or long "monday")
 * @param timezone - IANA timezone string (e.g. "America/Chicago")
 * @returns true if the timestamp falls outside business hours
 */
export function isAfterHours(
  callCreatedAt: string,
  businessHours: BusinessHours,
  timezone: string,
): boolean {
  const callDate = new Date(callCreatedAt);

  // Get local day (short and long) and time
  const shortDay = callDate.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone });
  const longDay = callDate.toLocaleDateString("en-US", { weekday: "long", timeZone: timezone }).toLowerCase();
  const localTime = callDate.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });

  // Check various key formats: "monday", "Mon", etc.
  const hours = businessHours[longDay] || businessHours[shortDay];

  if (!hours || hours.closed || hours.open === "closed") return true;
  if (localTime < hours.open || localTime >= hours.close) return true;
  return false;
}

/**
 * Check if a business is currently closed (real-time check using current time).
 * Used by the CLM route for live call handling.
 *
 * @param businessHours - Business hours keyed by day name (short format e.g. "Mon")
 * @param timezone - IANA timezone string
 * @returns true if the business is currently closed
 */
export function isCurrentlyAfterHours(
  businessHours: BusinessHours,
  timezone: string,
): boolean {
  return isAfterHours(new Date().toISOString(), businessHours, timezone);
}
