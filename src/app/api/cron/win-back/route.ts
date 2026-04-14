import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, winBackEmails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { sendEmailWithRetry } from "@/lib/email/client";
import { reportError } from "@/lib/error-reporting";

const FROM_EMAIL = "Capta <hello@contact.captahq.com>";

interface EmailTemplate {
  emailNumber: number;
  daysAfterCancel: number;
  subject: string;
  html: (biz: { ownerName: string; name: string }, reactivateUrl: string) => string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    emailNumber: 1,
    daysAfterCancel: 7,
    subject: "We miss you at Capta",
    html: (biz, reactivateUrl) => `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1B2A4A;">We miss you, ${biz.ownerName}!</h2>
        <p>It's been a week since you left Capta, and we wanted to check in.</p>
        <p>Since you've been gone, we've been working hard on improvements:</p>
        <ul>
          <li>Faster call answering and smarter appointment booking</li>
          <li>Enhanced bilingual support (English & Spanish)</li>
          <li>Better daily briefings from your AI receptionist</li>
        </ul>
        <p>Your callers are still looking for ${biz.name}. Let us help you catch every one.</p>
        <p style="margin-top: 24px;">
          <a href="${reactivateUrl}" style="display: inline-block; background: #D4A843; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reactivate My Account</a>
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 24px;">Questions? Just reply to this email.</p>
        <p>Best,<br/>The Capta Team</p>
      </div>
    `,
  },
  {
    emailNumber: 2,
    daysAfterCancel: 14,
    subject: "Your callers are still trying to reach you",
    html: (biz, reactivateUrl) => `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1B2A4A;">Don't let leads slip away</h2>
        <p>Hi ${biz.ownerName},</p>
        <p>Every missed call is a missed job. Before Capta, the average home service business misses 40% of inbound calls.</p>
        <p>With Capta answering for ${biz.name}, you never miss a lead — 24/7, in English and Spanish.</p>
        <p>Your AI receptionist is ready to pick right back up where you left off. All your settings and data are still saved.</p>
        <p style="margin-top: 24px;">
          <a href="${reactivateUrl}" style="display: inline-block; background: #D4A843; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Come Back to Capta</a>
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 24px;">Not ready yet? No pressure — we'll keep your data safe.</p>
        <p>Best,<br/>The Capta Team</p>
      </div>
    `,
  },
  {
    emailNumber: 3,
    daysAfterCancel: 30,
    subject: "We'd love to have you back",
    html: (biz, reactivateUrl) => `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1B2A4A;">We miss having ${biz.name} in the family</h2>
        <p>Hi ${biz.ownerName},</p>
        <p>It's been a month, and we'd love to have ${biz.name} back with Capta.</p>
        <p>Here's what you'd get back right away:</p>
        <ul>
          <li>Every call answered instantly, day and night</li>
          <li>Appointments booked directly into your calendar</li>
          <li>Bilingual support for all your callers</li>
          <li>Daily briefings and weekly performance reports</li>
        </ul>
        <p style="margin-top: 24px;">
          <a href="${reactivateUrl}" style="display: inline-block; background: #D4A843; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reactivate Your Account &rarr;</a>
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 24px;">Want to discuss a custom deal? Just reply to this email.</p>
        <p>Best,<br/>The Capta Team</p>
      </div>
    `,
  },
];

/**
 * GET /api/cron/win-back
 * Daily at 11 AM — sends a 3-email win-back sequence to canceled businesses.
 * Email 1: Day 7 after cancellation
 * Email 2: Day 14 after cancellation
 * Email 3: Day 30 after cancellation (with 50% off offer)
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("win-back", "0 11 * * *", async () => {
    let sent = 0;
    const skipped = 0;
    let errors = 0;

    try {
      // Find canceled businesses
      const canceledBusinesses = await db
        .select()
        .from(businesses)
        .where(eq(businesses.paymentStatus, "canceled"))
        .limit(500);

      const reactivateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;
      const now = new Date();

      for (const biz of canceledBusinesses) {
        if (!biz.ownerEmail) continue;

        try {
          // Determine cancellation date from updatedAt (when paymentStatus was set to canceled)
          const cancelDate = new Date(biz.updatedAt);
          const daysSinceCancel = Math.floor(
            (now.getTime() - cancelDate.getTime()) / (24 * 60 * 60 * 1000),
          );

          // Find which emails have already been sent
          const sentEmails = await db
            .select({ emailNumber: winBackEmails.emailNumber })
            .from(winBackEmails)
            .where(eq(winBackEmails.businessId, biz.id));

          const sentNumbers = new Set(sentEmails.map((e) => e.emailNumber));

          for (const template of EMAIL_TEMPLATES) {
            // Skip if already sent
            if (sentNumbers.has(template.emailNumber)) continue;

            // Check if it's time to send this email (within a 2-day window)
            if (
              daysSinceCancel >= template.daysAfterCancel &&
              daysSinceCancel <= template.daysAfterCancel + 2
            ) {
              await sendEmailWithRetry({
                from: FROM_EMAIL,
                to: biz.ownerEmail,
                subject: template.subject,
                html: template.html(
                  { ownerName: biz.ownerName, name: biz.name },
                  reactivateUrl,
                ),
              });

              await db.insert(winBackEmails).values({
                businessId: biz.id,
                emailNumber: template.emailNumber,
              });

              sent++;
            }
          }
        } catch (err) {
          reportError("Win-back email failed for business", err, {
            businessId: biz.id,
          });
          errors++;
        }
      }

      return NextResponse.json({
        success: true,
        sent,
        skipped,
        errors,
        canceledBusinesses: canceledBusinesses.length,
      });
    } catch (err) {
      reportError("[cron/win-back] Fatal error", err);
      return NextResponse.json({ error: "Win-back cron failed" }, { status: 500 });
    }
  });
}
