import { NextRequest, NextResponse } from "next/server";
import { processRetryQueue } from "@/lib/jobs/queue";
import { provisionTwilioNumber } from "@/lib/twilio/provision";
import { processCallSummary } from "@/lib/ai/call-summary";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";

/**
 * GET /api/cron/retry-queue
 *
 * Processes pending jobs in the retry queue with exponential backoff.
 * Run every 5 minutes via cron.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
