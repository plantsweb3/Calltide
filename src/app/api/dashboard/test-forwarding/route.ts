import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getTwilioClient } from "@/lib/twilio/client";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../demo-data";

/**
 * POST /api/dashboard/test-forwarding
 * Initiates a test call to the business's Twilio number to verify
 * call forwarding is working. Plays a short confirmation message.
 * Rate limited: 3 per hour.
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`test-forwarding:${businessId}`, {
    limit: 3,
    windowSeconds: 3600,
  });
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      success: true,
      callSid: "DEMO_CALL_SID",
      message: "Demo mode — no call placed",
    });
  }

  try {
    const [biz] = await db
      .select({
        id: businesses.id,
        twilioNumber: businesses.twilioNumber,
        defaultLanguage: businesses.defaultLanguage,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!biz.twilioNumber) {
      return NextResponse.json(
        { error: "No phone number provisioned yet. Please wait a moment and try again." },
        { status: 400 },
      );
    }

    const isSpanish = biz.defaultLanguage === "es";
    const message = isSpanish
      ? "Esta es una llamada de prueba de Capta. Tu recepcionista de inteligencia artificial esta funcionando correctamente. Puedes colgar ahora."
      : "This is a test call from Capta. Your AI receptionist is working correctly. You can hang up now.";

    const twilioClient = getTwilioClient();
    const twiml = `<Response><Say voice="Polly.Joanna" language="${isSpanish ? "es-US" : "en-US"}">${message}</Say><Pause length="2"/><Hangup/></Response>`;

    const call = await twilioClient.calls.create({
      to: biz.twilioNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
      twiml,
      timeout: 15,
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
    });
  } catch (err) {
    reportError("[test-forwarding] Failed to initiate test call", err, {
      extra: { businessId },
    });
    return NextResponse.json({ error: "Failed to initiate test call" }, { status: 500 });
  }
}
