import type { BusinessContext } from "@/types";

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

/**
 * Check available slots for a business on a given date.
 * STUB: Returns mock availability based on business hours.
 * Will be replaced with Google Calendar integration.
 */
export async function checkAvailability(
  biz: BusinessContext,
  date: string,
  service?: string
): Promise<TimeSlot[]> {
  const dayOfWeek = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: biz.timezone,
  }).toLowerCase();

  const hours = biz.businessHours[dayOfWeek];
  if (!hours || hours.open === "closed") {
    return [];
  }

  const openHour = parseInt(hours.open.split(":")[0]);
  const closeHour = parseInt(hours.close.split(":")[0]);
  const slots: TimeSlot[] = [];

  for (let h = openHour; h < closeHour; h++) {
    // Stub: mark every other slot as available
    slots.push({
      date,
      time: `${h.toString().padStart(2, "0")}:00`,
      available: h % 2 === 0,
    });
  }

  return slots;
}

/**
 * Book a specific time slot.
 * STUB: Always succeeds. Will check Google Calendar for conflicts.
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

  // Stub: always succeeds if slot exists and is available
  return { success: true };
}
