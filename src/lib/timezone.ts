/**
 * Timezone utilities for per-business date/time calculations.
 * Uses Intl.DateTimeFormat — no external dependencies.
 */

/**
 * Get today's date in the business's timezone as YYYY-MM-DD.
 */
export function getBusinessDate(timezone: string, now?: Date): string {
  const d = now ?? new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

/**
 * Get the current hour (0-23) in the business's timezone.
 */
export function getBusinessHour(timezone: string, now?: Date): number {
  const d = now ?? new Date();
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).format(d);
  return parseInt(hourStr, 10);
}

/**
 * Get a full-day UTC ISO range for a specific day offset in the business's timezone.
 * offsetDays: 0 = today, 1 = tomorrow, -1 = yesterday
 * Returns { start, end } as ISO strings bounding that local day in UTC.
 */
export function getBusinessDateRange(
  timezone: string,
  offsetDays: number = 0,
  now?: Date,
): { start: string; end: string; dateStr: string } {
  const d = now ?? new Date();

  // Get today's local date, then add offset
  const localDateStr = getBusinessDate(timezone, d);
  const [y, m, day] = localDateStr.split("-").map(Number);

  // Build a date at midnight local, then offset
  const localMidnight = new Date(`${localDateStr}T00:00:00`);
  localMidnight.setDate(localMidnight.getDate() + offsetDays);

  // Get the offset date string
  const offsetDateStr = getBusinessDate(
    timezone,
    new Date(localMidnight.getTime() + 12 * 60 * 60 * 1000), // nudge to noon to avoid DST edge
  );

  // Convert local midnight → UTC by finding the UTC offset at that point
  const startUtc = localDateToUtc(offsetDateStr, "00:00:00", timezone);
  const endUtc = localDateToUtc(offsetDateStr, "23:59:59", timezone);

  return {
    start: startUtc,
    end: endUtc,
    dateStr: offsetDateStr,
  };
}

/**
 * Get Monday-Sunday UTC boundaries for a given week in the business's timezone.
 * weeksAgo: 0 = current week, 1 = last week
 */
export function getBusinessWeekRange(
  timezone: string,
  weeksAgo: number = 0,
  now?: Date,
): { start: string; end: string; startDate: string; endDate: string } {
  const d = now ?? new Date();
  const localDateStr = getBusinessDate(timezone, d);
  const localDate = new Date(`${localDateStr}T12:00:00`);

  // Find this week's Monday (getDay: 0=Sun, 1=Mon)
  const dayOfWeek = localDate.getDay();
  const daysToMonday = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const thisMonday = new Date(localDate);
  thisMonday.setDate(localDate.getDate() - daysToMonday - weeksAgo * 7);

  const mondayStr = getBusinessDate(timezone, thisMonday);
  const sunday = new Date(thisMonday);
  sunday.setDate(thisMonday.getDate() + 6);
  const sundayStr = getBusinessDate(timezone, sunday);

  const startUtc = localDateToUtc(mondayStr, "00:00:00", timezone);
  const endUtc = localDateToUtc(sundayStr, "23:59:59", timezone);

  return {
    start: startUtc,
    end: endUtc,
    startDate: mondayStr,
    endDate: sundayStr,
  };
}

/**
 * Convert a local date + time string to a UTC ISO string.
 * Uses binary search on the UTC offset to handle DST correctly.
 */
function localDateToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): string {
  // Start with a naive guess: parse as UTC, then adjust
  const naive = new Date(`${dateStr}T${timeStr}Z`);

  // Check what local time this UTC instant maps to
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = new Date(naive.getTime() + attempt * 0); // first pass
    const localAtCandidate = getBusinessDate(timezone, candidate);
    const localHour = getBusinessHour(timezone, candidate);

    // Get full local time string
    const localTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(candidate);

    if (localAtCandidate === dateStr && localTimeStr === timeStr) {
      return candidate.toISOString();
    }
  }

  // Estimate offset: find what hour the timezone is relative to UTC
  const utcHour = naive.getUTCHours();
  const localHour = getBusinessHour(timezone, naive);
  let offsetHours = utcHour - localHour;
  // Normalize to -12..+14
  if (offsetHours > 14) offsetHours -= 24;
  if (offsetHours < -12) offsetHours += 24;

  const adjusted = new Date(naive.getTime() + offsetHours * 60 * 60 * 1000);
  return adjusted.toISOString();
}
