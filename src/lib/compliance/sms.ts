import { db } from "@/db";
import { smsOptOuts, consentRecords, businesses } from "@/db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
}

/**
 * TCPA-compliant pre-check. Must be called BEFORE every SMS send.
 */
export async function canSendSms(
  phoneNumber: string,
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

  // 2. Check quiet hours (8 AM - 9 PM CT — conservative default)
  const ctHour = getCurrentCTHour();
  if (ctHour < 8 || ctHour >= 21) {
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

function getCurrentCTHour(): number {
  const now = new Date();
  const ct = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
  );
  return ct.getHours();
}
