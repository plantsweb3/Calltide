import { getTwilioClient } from "./client";
import { db } from "@/db";
import { smsMessages } from "@/db/schema";

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
    console.error("SMS send failed:", error);

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
