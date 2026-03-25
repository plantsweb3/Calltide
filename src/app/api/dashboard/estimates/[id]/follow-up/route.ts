import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, customers, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms } from "@/lib/compliance/sms";
import { getEstimateFollowUpMessage } from "@/lib/sms-templates";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`estimates-follow-up:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — follow-up simulated" });
  }

  try {
    // Fetch estimate + customer + business
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)))
      .limit(1);

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, estimate.customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // TCPA check
    const smsCheck = await canSendSms(customer.phone);
    if (!smsCheck.allowed) {
      return NextResponse.json(
        { error: `Cannot send SMS: ${smsCheck.reason}` },
        { status: 403 }
      );
    }

    // Send the follow-up SMS
    const lang = (customer.language === "es" ? "es" : "en") as "en" | "es";
    const body = getEstimateFollowUpMessage(
      {
        customerName: customer.name || "there",
        service: estimate.service || "your inquiry",
        businessName: biz.name,
        businessPhone: biz.twilioNumber,
      },
      lang
    );

    const smsResult = await sendSMS({
      to: customer.phone,
      from: biz.twilioNumber,
      body,
      businessId,
      templateType: "estimate_follow_up",
    });

    if (!smsResult.success) {
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }

    // Update estimate
    const now = new Date();
    const nextFollowUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    await db.update(estimates).set({
      followUpCount: (estimate.followUpCount || 0) + 1,
      lastFollowUpAt: now.toISOString(),
      nextFollowUpAt: nextFollowUp,
      status: "follow_up",
      updatedAt: now.toISOString(),
    }).where(eq(estimates.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to send estimate follow-up", error, { businessId });
    return NextResponse.json({ error: "Failed to send follow-up" }, { status: 500 });
  }
}
