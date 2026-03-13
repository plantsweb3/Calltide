import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import type { BusinessContext } from "@/types";

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

/**
 * Check available slots for a business on a given date.
 * Generates hourly slots from business hours and filters out
 * times that conflict with existing confirmed appointments.
 */
export async function checkAvailability(
  biz: BusinessContext,
  date: string,
  service?: string
): Promise<TimeSlot[]> {
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return [];
  }
  const parsed = new Date(date + "T12:00:00");
  if (isNaN(parsed.getTime())) {
    return [];
  }

  const dayOfWeek = parsed
    .toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: biz.timezone,
    })
    .toLowerCase();

  const hours = biz.businessHours[dayOfWeek];
  if (!hours || hours.open === "closed") {
    return [];
  }

  const openHour = parseInt(hours.open.split(":")[0]);
  const openMin = parseInt(hours.open.split(":")[1] || "0");
  const closeHour = parseInt(hours.close.split(":")[0]);
  const closeMin = parseInt(hours.close.split(":")[1] || "0");

  // Validate time ranges
  if (openHour < 0 || openHour > 23 || openMin < 0 || openMin > 59 ||
      closeHour < 0 || closeHour > 23 || closeMin < 0 || closeMin > 59) {
    return [];
  }

  // Fetch existing confirmed appointments for this business on this date
  const booked = await db
    .select({ time: appointments.time, duration: appointments.duration })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, biz.id),
        eq(appointments.date, date),
        ne(appointments.status, "cancelled")
      )
    );

  // Build a set of blocked time ranges (in minutes from midnight)
  const blockedRanges: Array<{ start: number; end: number }> = booked.map((apt) => {
    const [h, m] = apt.time.split(":").map(Number);
    const start = h * 60 + m;
    const end = start + (apt.duration || 60);
    return { start, end };
  });

  // Also check Google Calendar busy times (if connected)
  try {
    const { getFreeBusy } = await import("@/lib/calendar/google-calendar");
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;
    const gcalBusy = await getFreeBusy(biz.id, dayStart, dayEnd);

    for (const busy of gcalBusy) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      const startMin = busyStart.getHours() * 60 + busyStart.getMinutes();
      const endMin = busyEnd.getHours() * 60 + busyEnd.getMinutes();
      if (endMin > startMin) {
        blockedRanges.push({ start: startMin, end: endMin });
      }
    }
  } catch {
    // Google Calendar unavailable — fall back to DB-only
  }

  function isBlocked(slotStartMin: number, slotDurationMin: number): boolean {
    const slotEnd = slotStartMin + slotDurationMin;
    return blockedRanges.some(
      (r) => slotStartMin < r.end && slotEnd > r.start
    );
  }

  // Generate hourly slots within business hours
  const slotDuration = 60; // minutes
  const slots: TimeSlot[] = [];
  const startMin = openHour * 60 + openMin;
  const endMin = closeHour * 60 + closeMin;

  for (let min = startMin; min + slotDuration <= endMin; min += slotDuration) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

    slots.push({
      date,
      time,
      available: !isBlocked(min, slotDuration),
    });
  }

  return slots;
}

/**
 * Book a specific time slot.
 * Checks business hours and DB for conflicts before allowing the booking.
 */
export async function bookSlot(
  biz: BusinessContext,
  date: string,
  time: string,
  service: string
): Promise<{ success: boolean; conflictReason?: string }> {
  const slots = await checkAvailability(biz, date, service);
  const slot = slots.find((s) => s.time === time);

  if (!slot) {
    return { success: false, conflictReason: "Time slot is outside business hours" };
  }

  if (!slot.available) {
    return { success: false, conflictReason: "That time slot is already booked" };
  }

  return { success: true };
}
