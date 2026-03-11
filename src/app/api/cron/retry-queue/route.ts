import { NextRequest, NextResponse } from "next/server";
import { processRetryQueue } from "@/lib/jobs/queue";
import { provisionTwilioNumber } from "@/lib/twilio/provision";
import { processCallSummary } from "@/lib/ai/call-summary";
import { getResend } from "@/lib/email/client";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/retry-queue
 *
 * Processes pending jobs in the retry queue with exponential backoff.
 * Run every 5 minutes via cron.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("retry-queue", "*/5 * * * *", async () => {
    try {
      const result = await processRetryQueue({
        twilio_provision: async (payload) => {
          const businessId = payload.businessId as string;
          if (!businessId) throw new Error("Missing businessId");
          const number = await provisionTwilioNumber(businessId);
          if (!number) throw new Error("Provisioning returned null");
        },

        call_summary: async (payload) => {
          const callId = payload.callId as string;
          const chatId = payload.chatId as string;
          if (!callId || !chatId) throw new Error("Missing callId or chatId");
          await processCallSummary(callId, chatId);
        },

        consent_record: async (payload) => {
          // Import dynamically to avoid circular deps
          const { recordConsent } = await import("@/lib/compliance/consent");
          const businessId = payload.businessId as string;
          if (!businessId) throw new Error("Missing businessId");
          await recordConsent({
            businessId,
            consentType: (payload.consentType as string) || "service_agreement",
          });
        },

        photo_request: async (payload) => {
          const { sendPhotoRequest } = await import("@/lib/photos/request");
          const { jobIntakes: intakeTable } = await import("@/db/schema");
          const { and: dAnd, eq: dEq } = await import("drizzle-orm");
          const { db: database } = await import("@/db");

          const callId = payload.callId as string;
          const businessId = payload.businessId as string;
          const callerPhone = payload.callerPhone as string;
          const callerName = (payload.callerName as string) || null;
          if (!callId || !businessId || !callerPhone) throw new Error("Missing photo request params");

          const [intake] = await database
            .select()
            .from(intakeTable)
            .where(dAnd(dEq(intakeTable.callId, callId), dEq(intakeTable.intakeComplete, true)))
            .limit(1);
          if (!intake) return; // No completed intake — skip silently

          await sendPhotoRequest({
            businessId,
            callId,
            callerPhone,
            callerName,
            jobIntakeId: intake.id,
            jobDescription: intake.scopeDescription || "project",
          });
        },

        email_send: async (payload) => {
          const resend = getResend();
          const from = payload.from as string;
          const to = payload.to as string | string[];
          const subject = payload.subject as string;
          const html = (payload.html as string) || "";
          const replyTo = (payload.replyTo as string) || undefined;
          if (!from || !to || !subject) throw new Error("Missing from, to, or subject");

          const { error } = await resend.emails.send({
            from,
            to,
            subject,
            html,
            ...(replyTo ? { replyTo } : {}),
          });

          if (error) {
            throw new Error(error.message);
          }
        },
      });

      return NextResponse.json({
        ok: true,
        ...result,
      });
    } catch (err) {
      reportError("Retry queue cron failed", err);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  });
}
