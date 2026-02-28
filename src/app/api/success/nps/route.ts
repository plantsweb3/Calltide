import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { db } from "@/db";
import {
  businesses,
  npsResponses,
  clientSuccessLog,
  churnRiskScores,
} from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getTwilioClient } from "@/lib/twilio/client";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { canSendSms } from "@/lib/compliance/sms";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

function classify(score: number): "promoter" | "passive" | "detractor" {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const rl = rateLimit(`nps:${getClientIp(request)}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get("businessId");
  const scoreRaw = searchParams.get("score");
  const token = searchParams.get("token");

  // ── Validate required params ──
  if (!businessId || !scoreRaw || !token) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  // ── Validate HMAC token ──
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) {
    reportError("NPS: CLIENT_AUTH_SECRET not configured", new Error("Missing secret"));
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const expectedToken = crypto
    .createHmac("sha256", secret)
    .update(`${businessId}:${scoreRaw}`)
    .digest("hex");

  if (!timingSafeEqual(token, expectedToken)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // ── Validate score ──
  const score = parseInt(scoreRaw, 10);
  if (isNaN(score) || score < 1 || score > 10) {
    return NextResponse.json(
      { error: "Score must be an integer between 1 and 10" },
      { status: 400 },
    );
  }

  try {
    // ── Duplicate check: no NPS from this business in last 7 days ──
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [existing] = await db
      .select({ id: npsResponses.id })
      .from(npsResponses)
      .where(
        and(
          eq(npsResponses.businessId, businessId),
          gte(npsResponses.createdAt, sevenDaysAgo),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.redirect(
        `${BASE_URL}/nps/thank-you?score=${score}&businessId=${businessId}&duplicate=1`,
      );
    }

    // ── Classify and insert ──
    const classification = classify(score);

    await db.insert(npsResponses).values({
      businessId,
      score,
      classification,
    });

    // ── Update business record ──
    await db
      .update(businesses)
      .set({
        lastNpsScore: score,
        lastNpsDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));

    // ── NPS-driven auto-actions ──
    if (classification === "promoter") {
      await handlePromoter(businessId);
    } else if (classification === "passive") {
      await handlePassive(businessId);
    } else {
      await handleDetractor(businessId, score);
    }

    return NextResponse.redirect(
      `${BASE_URL}/nps/thank-you?score=${score}&businessId=${businessId}`,
    );
  } catch (error) {
    reportError("NPS submission failed", error, { businessId });
    return NextResponse.json(
      { error: "Failed to record NPS response" },
      { status: 500 },
    );
  }
}

// ── PROMOTER (9-10): Send referral prompt email ──
async function handlePromoter(businessId: string) {
  try {
    const [business] = await db
      .select({
        ownerEmail: businesses.ownerEmail,
        ownerName: businesses.ownerName,
        name: businesses.name,
        referralCode: businesses.referralCode,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business?.ownerEmail || !business.referralCode) {
      return;
    }

    const shareLink = `${BASE_URL}/r/${business.referralCode}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Calltide <success@calltide.app>",
      to: business.ownerEmail,
      subject: `${business.ownerName}, you're amazing! Share the love & earn $497`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
          <img src="${BASE_URL}/images/logo.webp" alt="Calltide" style="height: 28px; margin-bottom: 32px;" />

          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px;">
            Thank you for the incredible score!
          </h1>

          <p style="font-size: 16px; color: #555; line-height: 1.7;">
            ${business.ownerName}, your rating means the world to us. We're thrilled
            that Calltide is making a real difference for ${business.name}.
          </p>

          <p style="font-size: 16px; color: #555; line-height: 1.7;">
            Know another business owner who's tired of missing calls? Share your
            referral link and <strong>you'll both save $497</strong> when they sign up.
          </p>

          <div style="background: #f8f6f0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="font-size: 13px; color: #888; margin-bottom: 8px;">Your referral link</p>
            <a href="${shareLink}" style="font-size: 18px; font-weight: 700; color: #c8a951; text-decoration: none;">
              ${shareLink}
            </a>
            <p style="font-size: 13px; color: #888; margin-top: 8px;">Code: <strong>${business.referralCode}</strong></p>
          </div>

          <p style="font-size: 14px; color: #888; line-height: 1.6;">
            Just send this link to any business owner. When they sign up,
            you both get $497 off your next month.
          </p>

          <p style="font-size: 14px; color: #aaa; margin-top: 32px;">
            &mdash; The Calltide Team
          </p>
        </div>
      `,
    });

    await db.insert(clientSuccessLog).values({
      businessId,
      eventType: "referral_prompt",
      eventData: {
        referralCode: business.referralCode,
        shareLink,
        trigger: "nps_promoter",
      },
      emailSentAt: new Date().toISOString(),
    });
  } catch (error) {
    reportError("NPS promoter referral email failed", error, { businessId });
  }
}

// ── PASSIVE (7-8): Log for re-survey ──
async function handlePassive(businessId: string) {
  try {
    await db.insert(clientSuccessLog).values({
      businessId,
      eventType: "nps_response",
      eventData: {
        classification: "passive",
        note: "Re-survey in 30 days",
        resurveyDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    });
  } catch (error) {
    reportError("NPS passive log failed", error, { businessId });
  }
}

// ── DETRACTOR (1-6): Escalate immediately ──
async function handleDetractor(businessId: string, score: number) {
  try {
    const [business] = await db
      .select({
        ownerPhone: businesses.ownerPhone,
        ownerName: businesses.ownerName,
        ownerEmail: businesses.ownerEmail,
        name: businesses.name,
        twilioNumber: businesses.twilioNumber,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) return;

    // Send escalation SMS to business owner (with TCPA compliance check)
    let smsSent = false;
    const smsCheck = await canSendSms(business.ownerPhone);
    if (smsCheck.allowed) {
      const twilioClient = getTwilioClient();
      await twilioClient.messages.create({
        to: business.ownerPhone,
        from: business.twilioNumber,
        body: `[Calltide Alert] ${business.ownerName}, your business ${business.name} received an NPS score of ${score}/10. This indicates a risk of churn. Our team will reach out within 24 hours to address any concerns. Reply HELP for immediate support.`,
      });
      smsSent = true;
    }

    // Send escalation email
    if (business.ownerEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Calltide <success@calltide.app>",
        to: business.ownerEmail,
        subject: `Action needed: ${business.name} NPS score ${score}/10`,
        html: `
          <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
            <img src="${BASE_URL}/images/logo.webp" alt="Calltide" style="height: 28px; margin-bottom: 32px;" />

            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #dc2626; font-weight: 600; margin: 0;">
                NPS Score: ${score}/10 &mdash; Detractor
              </p>
            </div>

            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px;">
              ${business.ownerName}, we noticed a low score.
            </h1>

            <p style="font-size: 16px; color: #555; line-height: 1.7;">
              We take your feedback seriously. A member of our success team will
              reach out within 24 hours to understand what's not working and make
              it right.
            </p>

            <p style="font-size: 16px; color: #555; line-height: 1.7;">
              In the meantime, you can reply directly to this email or call us
              at any time.
            </p>

            <p style="font-size: 14px; color: #aaa; margin-top: 32px;">
              &mdash; The Calltide Team
            </p>
          </div>
        `,
      });
    }

    // Update churn risk to critical (9)
    const [existingRisk] = await db
      .select({ id: churnRiskScores.id })
      .from(churnRiskScores)
      .where(eq(churnRiskScores.customerId, businessId))
      .limit(1);

    if (existingRisk) {
      await db
        .update(churnRiskScores)
        .set({
          score: 9,
          factors: ["nps_detractor", `nps_score_${score}`],
          calculatedAt: new Date().toISOString(),
        })
        .where(eq(churnRiskScores.id, existingRisk.id));
    } else {
      await db.insert(churnRiskScores).values({
        customerId: businessId,
        score: 9,
        factors: ["nps_detractor", `nps_score_${score}`],
      });
    }

    // Mark NPS response as escalated
    await db
      .update(npsResponses)
      .set({ escalated: true })
      .where(
        and(
          eq(npsResponses.businessId, businessId),
          eq(npsResponses.score, score),
        ),
      );

    // Create admin notification for detractor alert
    await createNotification({
      source: "retention",
      severity: "warning",
      title: "NPS detractor alert",
      message: `${business.name} — NPS score ${score}/10. Owner ${business.ownerName} has been notified.`,
      actionUrl: "/admin/client-success",
    });

    // Log in client success log
    await db.insert(clientSuccessLog).values({
      businessId,
      eventType: "nps_response",
      eventData: {
        classification: "detractor",
        score,
        escalated: true,
        smsSent,
        emailSent: !!business.ownerEmail,
        churnRiskUpdated: 9,
      },
    });
  } catch (error) {
    reportError("NPS detractor escalation failed", error, { businessId });
  }
}
