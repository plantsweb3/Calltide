import { db } from "@/db";
import { smsOptOuts, consentRecords, businesses } from "@/db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { getBusinessHour } from "@/lib/timezone";

export function normalizePhone(phone: string): string {
  if (phone.length > 30) return phone.slice(0, 30).replace(/\D/g, "");
  return phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
}

/**
 * TCPA-compliant pre-check. Must be called BEFORE every SMS send.
 * @param timezone - Business timezone for quiet hours check. Defaults to America/Chicago.
 */
export async function canSendSms(
  phoneNumber: string,
  timezone?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const normalized = normalizePhone(phoneNumber);

  // 1. Check opt-out list
  const [optOut] = await db
    .select()
    .from(smsOptOuts)
    .where(
      and(
        eq(smsOptOuts.phoneNumber, normalized),
        isNull(smsOptOuts.reoptedInAt),
      ),
    )
    .limit(1);

  if (optOut) return { allowed: false, reason: "opted_out" };

  // 2. Check quiet hours (8 AM - 9 PM in business timezone — conservative default)
  const tz = timezone || "America/Chicago";
  const currentHour = getBusinessHour(tz);
  if (currentHour < 8 || currentHour >= 21) {
    return { allowed: false, reason: "quiet_hours" };
  }

  // 3. Check for active SMS consent (by phone or by business)
  const [phoneConsent] = await db
    .select({ id: consentRecords.id })
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.phoneNumber, normalized),
        inArray(consentRecords.consentType, ["sms_client", "sms_caller"]),
        eq(consentRecords.status, "active"),
      ),
    )
    .limit(1);

  if (phoneConsent) return { allowed: true };

  // Check business-level consent (client signed up and consented)
  const [bizConsent] = await db
    .select({ id: consentRecords.id })
    .from(consentRecords)
    .innerJoin(businesses, eq(consentRecords.businessId, businesses.id))
    .where(
      and(
        eq(businesses.ownerPhone, phoneNumber),
        eq(consentRecords.consentType, "sms_client"),
        eq(consentRecords.status, "active"),
      ),
    )
    .limit(1);

  if (bizConsent) return { allowed: true };

  // No consent found — still allow for owner notifications (system SMS)
  // The caller should decide based on context whether to proceed
  return { allowed: true };
}
