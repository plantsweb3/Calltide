import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getResend } from "@/lib/email/client";
import { setupSessions, setupRetargetEmails } from "@/db/schema";
import { and, eq, isNotNull, ne, gte } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";
import {
  getSetupEmail,
  SETUP_EMAIL_SCHEDULE,
  SETUP_ABANDON_HOURS,
  type SetupEmailNumber,
} from "@/lib/emails/setup-retarget";
import { verifyCronAuth } from "@/lib/cron-auth";

const FROM_EMAIL = "Ulysses at Capta <hello@captahq.com>";
const REPLY_TO = "hello@captahq.com";

/**
 * GET /api/cron/setup-retarget
 *
 * Daily cron (11 AM) — sends retarget emails to setup sessions
 * that have an email (passed step 2) but haven't converted.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  let resend;
  try {
    resend = getResend();
  } catch {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let abandoned = 0;
  let errors = 0;

  try {
    // Find active setup sessions with email (passed step 2)
    const candidates = await db
      .select()
      .from(setupSessions)
      .where(
        and(
          eq(setupSessions.status, "active"),
          isNotNull(setupSessions.ownerEmail),
        ),
      );

    const now = Date.now();

    for (const session of candidates) {
      if (!session.ownerEmail) {
        skipped++;
        continue;
      }

      const createdAt = new Date(session.createdAt).getTime();
      const hoursSince = (now - createdAt) / (1000 * 60 * 60);

      // Check for abandonment (14 days)
      if (hoursSince >= SETUP_ABANDON_HOURS) {
        await db
          .update(setupSessions)
          .set({
            status: "abandoned",
            abandonedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(setupSessions.id, session.id));
        abandoned++;

        await logActivity({
          type: "status_change",
          entityType: "prospect",
          entityId: session.prospectId || session.id,
          title: "Setup session abandoned (14d timeout)",
          detail: `${session.businessName || "Unknown"} — step ${session.maxStepReached}/6, created ${Math.round(hoursSince / 24)}d ago`,
        });
        continue;
      }

      // Get already-sent emails for this session
      const sentEmails = await db
        .select({ emailNumber: setupRetargetEmails.emailNumber })
        .from(setupRetargetEmails)
        .where(
          and(
            eq(setupRetargetEmails.setupSessionId, session.id),
            ne(setupRetargetEmails.status, "failed"),
          ),
        );
      const sentNumbers = new Set(sentEmails.map((e) => e.emailNumber));

      // Determine which email to send
      let emailToSend: SetupEmailNumber | null = null;
      for (const schedule of SETUP_EMAIL_SCHEDULE) {
        if (hoursSince >= schedule.hoursAfter && !sentNumbers.has(schedule.emailNumber)) {
          emailToSend = schedule.emailNumber;
        }
      }

      if (!emailToSend) {
        skipped++;
        continue;
      }

      // Idempotency: check no email was sent for this session+step in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const [recentlySent] = await db
        .select({ id: setupRetargetEmails.id })
        .from(setupRetargetEmails)
        .where(
          and(
            eq(setupRetargetEmails.setupSessionId, session.id),
            eq(setupRetargetEmails.emailNumber, emailToSend),
            ne(setupRetargetEmails.status, "failed"),
            gte(setupRetargetEmails.sentAt, oneHourAgo),
          ),
        )
        .limit(1);

      if (recentlySent) {
        skipped++;
        continue;
      }

      // Build email data
      const emailData = {
        sessionId: session.id,
        token: session.token,
        businessName: session.businessName || "Your Business",
        receptionistName: session.receptionistName || "Maria",
        trade: session.businessType || "other",
        city: session.city || "",
        currentStep: session.currentStep,
        maxStepReached: session.maxStepReached,
        language: session.language || "en",
      };

      const email = getSetupEmail(emailToSend, emailData);

      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          replyTo: REPLY_TO,
          to: session.ownerEmail,
          subject: email.subject,
          html: email.html,
        });

        if (error) {
          errors++;
          await db.insert(setupRetargetEmails).values({
            setupSessionId: session.id,
            emailNumber: emailToSend,
            templateKey: email.templateKey,
            status: "failed",
            language: emailData.language,
          });
          reportError(`Setup retarget email ${emailToSend} failed for ${session.id}`, error);
          continue;
        }

        await db.insert(setupRetargetEmails).values({
          setupSessionId: session.id,
          emailNumber: emailToSend,
          templateKey: email.templateKey,
          status: "sent",
          resendId: data?.id,
          language: emailData.language,
        });

        sent++;

        await logActivity({
          type: "email_sent",
          entityType: "prospect",
          entityId: session.prospectId || session.id,
          title: `Setup retarget email ${emailToSend} sent`,
          detail: `To: ${session.ownerEmail} — ${email.subject}`,
        });
      } catch (err) {
        errors++;
        reportError(`Setup retarget email error for ${session.id}`, err);
      }
    }

    return NextResponse.json({
      success: true,
      candidates: candidates.length,
      sent,
      skipped,
      abandoned,
      errors,
    });
  } catch (error) {
    reportError("Setup retarget cron error", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
