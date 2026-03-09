import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobCards, ownerResponses, businesses } from "@/db/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error-reporting";

/**
 * Cron: Job Card Expiry + Reminder
 * Runs every hour. Handles:
 * 1. 4-hour reminder: nudge owner if no response after 4 hours
 * 2. 24-hour expiry: mark card as expired, no customer notification
 * 3. Awaiting adjustment nudge: remind owner to send adjusted price after 2 hours
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  let reminders = 0;
  let expired = 0;
  let adjustNudges = 0;
  let errors = 0;

  try {
    // 1. Send 4-hour reminders for pending_review cards (no reminder sent yet)
    const pendingCards = await db
      .select()
      .from(jobCards)
      .where(
        and(
          eq(jobCards.status, "pending_review"),
          isNull(jobCards.reminderSentAt),
          lt(jobCards.createdAt, fourHoursAgo),
        ),
      );

    for (const card of pendingCards) {
      try {
        const [biz] = await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, card.businessId))
          .limit(1);

        if (!biz?.ownerPhone) continue;

        const fromNumber = biz.twilioNumber || env.TWILIO_PHONE_NUMBER;
        const callerName = card.callerName || "a caller";
        const jobDesc = card.jobTypeLabel || "service request";

        const body = `Reminder: ${callerName} is waiting on your response for "${jobDesc}". Reply 1 to confirm, 2 to adjust, or 3 for a site visit.`;

        const result = await sendSMS({
          to: biz.ownerPhone,
          from: fromNumber,
          body,
          businessId: biz.id,
          templateType: "owner_notify",
        });

        if (result.success) {
          await db.update(jobCards).set({
            reminderSentAt: now.toISOString(),
            updatedAt: now.toISOString(),
          }).where(eq(jobCards.id, card.id));

          await db.insert(ownerResponses).values({
            businessId: biz.id,
            jobCardId: card.id,
            direction: "outbound",
            messageType: "reminder",
            messageText: body,
            twilioSid: result.sid,
          });

          reminders++;
        }
      } catch (err) {
        reportError("Job card reminder failed", err, { extra: { jobCardId: card.id } });
        errors++;
      }
    }

    // 2. Expire 24-hour old pending_review cards
    const expiredCards = await db
      .select()
      .from(jobCards)
      .where(
        and(
          eq(jobCards.status, "pending_review"),
          lt(jobCards.createdAt, twentyFourHoursAgo),
        ),
      );

    for (const card of expiredCards) {
      try {
        await db.update(jobCards).set({
          status: "expired",
          expiredAt: now.toISOString(),
          updatedAt: now.toISOString(),
        }).where(eq(jobCards.id, card.id));

        await db.insert(ownerResponses).values({
          businessId: card.businessId,
          jobCardId: card.id,
          direction: "outbound",
          messageType: "expiry",
          messageText: "Job card expired after 24 hours without response.",
        });

        // Notify owner that the card expired
        const [biz] = await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, card.businessId))
          .limit(1);

        if (biz?.ownerPhone) {
          const fromNumber = biz.twilioNumber || env.TWILIO_PHONE_NUMBER;
          const callerName = card.callerName || "A caller";

          await sendSMS({
            to: biz.ownerPhone,
            from: fromNumber,
            body: `${callerName}'s job card for "${card.jobTypeLabel || "service"}" expired (no response in 24hrs). You can still reach out to them directly.`,
            businessId: biz.id,
            templateType: "owner_notify",
          });
        }

        expired++;
      } catch (err) {
        reportError("Job card expiry failed", err, { extra: { jobCardId: card.id } });
        errors++;
      }
    }

    // 3. Nudge owners with awaiting_adjustment cards older than 2 hours
    const adjustingCards = await db
      .select()
      .from(jobCards)
      .where(
        and(
          eq(jobCards.status, "awaiting_adjustment"),
          isNull(jobCards.reminderSentAt),
          lt(jobCards.updatedAt, twoHoursAgo),
        ),
      );

    for (const card of adjustingCards) {
      try {
        const [biz] = await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, card.businessId))
          .limit(1);

        if (!biz?.ownerPhone) continue;

        const fromNumber = biz.twilioNumber || env.TWILIO_PHONE_NUMBER;
        const body = `Still waiting on your adjusted estimate for ${card.callerName || "the caller"}'s ${card.jobTypeLabel || "job"}. Reply with a dollar amount (e.g. $800) or range ($800-$1200).`;

        const result = await sendSMS({
          to: biz.ownerPhone,
          from: fromNumber,
          body,
          businessId: biz.id,
          templateType: "owner_notify",
        });

        if (result.success) {
          await db.update(jobCards).set({
            reminderSentAt: now.toISOString(),
            updatedAt: now.toISOString(),
          }).where(eq(jobCards.id, card.id));

          await db.insert(ownerResponses).values({
            businessId: biz.id,
            jobCardId: card.id,
            direction: "outbound",
            messageType: "reminder",
            messageText: body,
            twilioSid: result.sid,
          });

          adjustNudges++;
        }
      } catch (err) {
        reportError("Adjustment nudge failed", err, { extra: { jobCardId: card.id } });
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      reminders,
      expired,
      adjustNudges,
      errors,
    });
  } catch (error) {
    reportError("Job card expiry cron failed", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
