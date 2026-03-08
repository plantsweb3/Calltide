import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTwilioClient } from "./client";
import { reportError } from "@/lib/error-reporting";
import { createNotification } from "@/lib/notifications";

/**
 * Auto-provision a local Twilio phone number for a business.
 * Buys a number in the US with voice + SMS capabilities,
 * assigns it to the business record, and configures webhooks.
 */
export async function provisionTwilioNumber(businessId: string): Promise<string | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    reportError("Cannot provision Twilio number — NEXT_PUBLIC_APP_URL not set", null);
    return null;
  }

  // Guard: check if business already has a number assigned
  const [existing] = await db
    .select({ twilioNumber: businesses.twilioNumber })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (existing?.twilioNumber && existing.twilioNumber.startsWith("+")) {
    console.log(`[provision] Business ${businessId.slice(0, 8)} already has ${existing.twilioNumber} — skipping`);
    return existing.twilioNumber;
  }

  const client = getTwilioClient();

  try {
    // Search for an available local number
    const available = await client.availablePhoneNumbers("US").local.list({
      voiceEnabled: true,
      smsEnabled: true,
      limit: 1,
    });

    if (available.length === 0) {
      reportError("No available Twilio numbers found", null, { extra: { businessId } });
      await createNotification({
        source: "financial",
        severity: "warning",
        title: "Twilio number provisioning failed",
        message: `No available numbers for business ${businessId}. Assign manually.`,
        actionUrl: "/admin/clients",
      });
      return null;
    }

    // Purchase the number
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      voiceUrl: `${appUrl}/api/webhooks/twilio/voice`,
      voiceMethod: "POST",
      smsUrl: `${appUrl}/api/webhooks/twilio/sms`,
      smsMethod: "POST",
      friendlyName: `Calltide — ${businessId.slice(0, 8)}`,
    });

    // Assign to business
    await db
      .update(businesses)
      .set({
        twilioNumber: purchased.phoneNumber,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));

    await createNotification({
      source: "financial",
      severity: "info",
      title: "Phone number auto-provisioned",
      message: `${purchased.phoneNumber} assigned to business ${businessId.slice(0, 8)}`,
      actionUrl: "/admin/clients",
    });

    return purchased.phoneNumber;
  } catch (err) {
    reportError("Twilio number provisioning failed", err, { extra: { businessId } });
    await createNotification({
      source: "financial",
      severity: "warning",
      title: "Twilio number provisioning failed",
      message: `Auto-provision failed for business ${businessId.slice(0, 8)}. Assign manually.`,
      actionUrl: "/admin/clients",
    });
    return null;
  }
}
