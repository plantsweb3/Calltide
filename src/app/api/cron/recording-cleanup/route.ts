import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, businesses } from "@/db/schema";
import { eq, and, isNotNull, lt } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { getTwilioClient } from "@/lib/twilio/client";
import { reportError, reportWarning } from "@/lib/error-reporting";

/**
 * GET /api/cron/recording-cleanup
 *
 * Deletes call recordings that have exceeded the business's retention period.
 * Runs daily at 3 AM.
 *
 * For each business:
 *   - Finds calls with a recordingUrl older than audioRetentionDays
 *   - Deletes the recording from Twilio
 *   - Sets recordingUrl = null on the call record
 *
 * vercel.json: { "crons": [{ "path": "/api/cron/recording-cleanup", "schedule": "0 8 * * *" }] }
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("recording-cleanup", "0 8 * * *", async () => {
    // Get all active businesses with their retention settings
    const allBusinesses = await db
      .select({
        id: businesses.id,
        audioRetentionDays: businesses.audioRetentionDays,
      })
      .from(businesses)
      .where(eq(businesses.active, true));

    let totalDeleted = 0;
    let totalErrors = 0;

    for (const biz of allBusinesses) {
      const retentionDays = biz.audioRetentionDays ?? 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffIso = cutoffDate.toISOString();

      // Find expired recordings for this business
      const expiredCalls = await db
        .select({
          id: calls.id,
          recordingUrl: calls.recordingUrl,
          twilioCallSid: calls.twilioCallSid,
        })
        .from(calls)
        .where(
          and(
            eq(calls.businessId, biz.id),
            isNotNull(calls.recordingUrl),
            lt(calls.createdAt, cutoffIso),
          ),
        )
        .limit(100); // Process in batches to avoid timeouts

      for (const call of expiredCalls) {
        try {
          // Attempt to delete recording from Twilio
          if (call.recordingUrl && call.twilioCallSid) {
            // Extract recording SID from URL (format: .../Recordings/RExxxxx.mp3)
            const match = call.recordingUrl.match(/Recordings\/(RE[a-f0-9]+)/i);
            if (!match) {
              reportWarning("Recording URL format unexpected, skipping cleanup", { callId: call.id, url: call.recordingUrl });
              continue;
            }

            try {
              const twilioClient = getTwilioClient();
              await twilioClient.recordings(match[1]).remove();
            } catch (twilioErr) {
              // Twilio deletion may fail if already deleted or URL is external — continue anyway
              reportError("Twilio recording deletion failed", twilioErr, {
                extra: { callId: call.id, recordingUrl: call.recordingUrl },
              });
            }
          }

          // Clear recording URL from DB regardless of Twilio deletion result
          await db.update(calls).set({
            recordingUrl: null,
            updatedAt: new Date().toISOString(),
          }).where(eq(calls.id, call.id));

          totalDeleted++;
        } catch (err) {
          totalErrors++;
          reportError("Recording cleanup failed for call", err, {
            extra: { callId: call.id },
          });
        }
      }
    }

    reportWarning("[recording-cleanup] completed", { deleted: totalDeleted, errors: totalErrors });

    return NextResponse.json({
      ok: true,
      deleted: totalDeleted,
      errors: totalErrors,
    });
  });
}
