import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses, smsOptOuts } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { normalizePhone } from "@/lib/compliance/sms";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const sendSmsSchema = z.object({
  customerPhone: z.string().min(10).max(20),
  message: z.string().min(1).max(1600), // SMS max length
  customerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-sms-send-${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = sendSmsSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    const { customerPhone, message } = result.data;

    // Get business Twilio number
    const [biz] = await db
      .select({ twilioNumber: businesses.twilioNumber, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!biz.twilioNumber) {
      return NextResponse.json({ error: "No Twilio number configured" }, { status: 400 });
    }

    // Check SMS opt-out before sending
    const normalized = normalizePhone(customerPhone);
    const [optOut] = await db
      .select({ id: smsOptOuts.id })
      .from(smsOptOuts)
      .where(and(eq(smsOptOuts.phoneNumber, normalized), isNull(smsOptOuts.reoptedInAt)))
      .limit(1);

    if (optOut) {
      return NextResponse.json(
        { error: "This customer has opted out of SMS messages" },
        { status: 400 },
      );
    }

    // Send via Twilio
    const smsResult = await sendSMS({
      to: customerPhone,
      from: biz.twilioNumber,
      body: message,
      businessId,
      templateType: "dashboard_manual",
    });

    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.error || "Failed to send SMS" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sid: smsResult.sid,
    });
  } catch (error) {
    reportError("Failed to send SMS from dashboard", error, { businessId });
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
