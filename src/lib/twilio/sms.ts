import { getTwilioClient } from "./client";
import { db } from "@/db";
import { leads, smsMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

interface SendSMSParams {
  to: string;
  from: string;
  body: string;
  businessId: string;
  leadId?: string;
  callId?: string;
  templateType?: string;
}

export async function sendSMS(params: SendSMSParams) {
  // Check SMS opt-out before sending (skip for owner notifications)
  if (params.templateType !== "owner_notify" && params.leadId) {
    const [lead] = await db
      .select({ smsOptOut: leads.smsOptOut })
      .from(leads)
      .where(eq(leads.id, params.leadId))
      .limit(1);

    if (lead?.smsOptOut) {
      console.log(`SMS blocked — lead ${params.leadId} has opted out`);
      return { success: false, error: "Lead has opted out of SMS" };
    }
  }

  const client = getTwilioClient();

  try {
    const message = await client.messages.create({
      to: params.to,
      from: params.from,
      body: params.body,
    });

    await db.insert(smsMessages).values({
      businessId: params.businessId,
      leadId: params.leadId,
      callId: params.callId,
      direction: "outbound",
      fromNumber: params.from,
      toNumber: params.to,
      body: params.body,
      templateType: params.templateType,
      twilioSid: message.sid,
      status: "sent",
    });

    return { success: true, sid: message.sid };
  } catch (error) {
    reportError("SMS send failed", error, { businessId: params.businessId });

    await db.insert(smsMessages).values({
      businessId: params.businessId,
      leadId: params.leadId,
      callId: params.callId,
      direction: "outbound",
      fromNumber: params.from,
      toNumber: params.to,
      body: params.body,
      templateType: params.templateType,
      status: "failed",
    });

    return { success: false, error: String(error) };
  }
}
