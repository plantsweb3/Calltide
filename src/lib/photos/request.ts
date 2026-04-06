import { db } from "@/db";
import { businesses, calls, leads } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms } from "@/lib/compliance/sms";
import { reportWarning } from "@/lib/error-reporting";

interface PhotoRequestParams {
  businessId: string;
  callId: string;
  callerPhone: string;
  callerName: string | null;
  jobIntakeId: string;
  jobDescription: string;
}

/**
 * Send a photo request SMS to the caller after a call with completed intake.
 * Asks the caller to reply with photos of the job site/damage/area.
 */
export async function sendPhotoRequest(params: PhotoRequestParams): Promise<void> {
  const { businessId, callId, callerPhone, callerName, jobIntakeId, jobDescription } = params;

  // Get business info for the from number and name
  const [biz] = await db
    .select({
      name: businesses.name,
      twilioNumber: businesses.twilioNumber,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz?.twilioNumber) return;

  // TCPA compliance check
  try {
    const smsCheck = await canSendSms(callerPhone);
    if (!smsCheck.allowed) {
      reportWarning(`Photo request SMS blocked by compliance: ${smsCheck.reason}`);
      return;
    }
  } catch {
    // Non-fatal: if compliance check fails, skip the photo request
    return;
  }

  // Determine language from the call or lead record
  const language = await detectLanguage(businessId, callId, callerPhone);

  // Find the lead for SMS logging
  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.phone, callerPhone)))
    .limit(1);

  const name = callerName || (language === "es" ? "estimado cliente" : "there");
  const shortDesc = jobDescription.length > 60 ? jobDescription.slice(0, 57) + "..." : jobDescription;

  const body =
    language === "es"
      ? `Hola ${name}, gracias por llamar a ${biz.name}! Si tiene fotos del area de ${shortDesc}, responda a este texto con ellas. Nos ayuda a darle un estimado mas preciso. \u{1F4F8}`
      : `Hi ${name}, thanks for calling ${biz.name}! If you have any photos of the ${shortDesc} area, reply to this text with them. It helps us give you a more accurate estimate. \u{1F4F8}`;

  await sendSMS({
    to: callerPhone,
    from: biz.twilioNumber,
    body,
    businessId,
    leadId: lead?.id,
    callId,
    templateType: "photo_request",
  });

  reportWarning("Photo request SMS sent", { businessId, jobIntakeId, callerPhone: "***" });
}

/**
 * Detect the caller's language from the call record or lead.
 */
async function detectLanguage(
  businessId: string,
  callId: string,
  callerPhone: string,
): Promise<"en" | "es"> {
  // Check call record first
  const [call] = await db
    .select({ language: calls.language })
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);

  if (call?.language === "es") return "es";

  // Check lead record
  const [lead] = await db
    .select({ language: leads.language })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.phone, callerPhone)))
    .limit(1);

  if (lead?.language === "es") return "es";

  return "en";
}
