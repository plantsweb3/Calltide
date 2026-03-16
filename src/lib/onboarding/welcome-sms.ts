import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { reportError } from "@/lib/error-reporting";

/**
 * Send a welcome SMS to the business owner immediately after account creation.
 * Sent FROM the business's Capta number so the owner saves it in contacts.
 *
 * Polls for Twilio number readiness since provisioning is async.
 */
export async function sendWelcomeSms(
  businessId: string,
  password: string,
): Promise<void> {
  // Poll for Twilio number (provisioning is async, may take up to 30s)
  let twilioNumber: string | null = null;
  const MAX_POLLS = 10;
  const POLL_INTERVAL = 3000;

  for (let i = 0; i < MAX_POLLS; i++) {
    const [biz] = await db
      .select({
        twilioNumber: businesses.twilioNumber,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (biz?.twilioNumber) {
      twilioNumber = biz.twilioNumber;
      break;
    }

    if (i < MAX_POLLS - 1) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
  }

  if (!twilioNumber) {
    reportError("[welcome-sms] Twilio number not ready after polling", new Error("No number"), {
      extra: { businessId },
    });
    return;
  }

  // Load full business data for the message
  const [biz] = await db
    .select({
      ownerName: businesses.ownerName,
      ownerPhone: businesses.ownerPhone,
      ownerEmail: businesses.ownerEmail,
      receptionistName: businesses.receptionistName,
      twilioNumber: businesses.twilioNumber,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz || !biz.ownerPhone) return;

  const firstName = biz.ownerName?.split(" ")[0] || "there";
  const receptionistName = biz.receptionistName || "Maria";
  const formattedNumber = formatPhoneForDisplay(twilioNumber);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";

  const message =
    `Hi ${firstName}! I'm ${receptionistName}, your new AI receptionist from Capta.\n\n` +
    `Your Capta number: ${formattedNumber}\n\n` +
    `To start answering your calls, set up call forwarding:\n` +
    `AT&T: Dial *21*${twilioNumber}#\n` +
    `Verizon: Dial *72 ${twilioNumber}\n` +
    `T-Mobile: Dial **21*${twilioNumber}#\n\n` +
    `Dashboard: ${appUrl}/dashboard\n` +
    `Email: ${biz.ownerEmail}\n\n` +
    `Text me anytime — I'm here 24/7!`;

  await sendSMS({
    to: biz.ownerPhone,
    from: twilioNumber,
    body: message,
    businessId,
    templateType: "owner_notify",
  });
}

function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
