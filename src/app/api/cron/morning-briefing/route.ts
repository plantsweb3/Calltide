import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";

/**
 * GET /api/cron/morning-briefing
 *
 * Sends each active business owner a proactive morning briefing from Maria.
 * Runs daily at 12:00 UTC (7:00 AM Central).
 * Uses timezone-aware gating so owners only receive the SMS between 6-9 AM local time.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("morning-briefing", "0 12 * * *", async () => {
    try {
      // Get all active businesses that have daily summary enabled
      const activeBusinesses = await db
        .select({
          id: businesses.id,
          name: businesses.name,
          ownerPhone: businesses.ownerPhone,
          twilioNumber: businesses.twilioNumber,
          receptionistName: businesses.receptionistName,
          defaultLanguage: businesses.defaultLanguage,
          enableDailySummary: businesses.enableDailySummary,
          timezone: businesses.timezone,
        })
        .from(businesses)
        .where(
          and(
            eq(businesses.active, true),
            eq(businesses.enableDailySummary, true),
          ),
        );

      let sent = 0;
      let skipped = 0;

      for (const biz of activeBusinesses) {
        try {
          if (!biz.ownerPhone || !biz.twilioNumber) {
            skipped++;
            continue;
          }

          // Check timezone — only send if it's roughly morning (6-9 AM) in their timezone
          const now = new Date();
          const bizHour = parseInt(
            now.toLocaleString("en-US", {
              timeZone: biz.timezone || "America/Chicago",
              hour: "numeric",
              hour12: false,
            }),
          );
          if (bizHour < 6 || bizHour > 9) {
            skipped++;
            continue;
          }

          // Use Maria's chat engine to generate the briefing
          const { chat: mariaChat } = await import("@/lib/maria/chat-engine");
          const result = await mariaChat(
            biz.id,
            biz.defaultLanguage === "es"
              ? "Dame el resumen de la mañana"
              : "Give me the morning briefing",
            "sms",
          );

          if (result.reply) {
            const replyBody = result.reply
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
              .slice(0, 1500);
            await sendSMS({
              to: biz.ownerPhone,
              from: biz.twilioNumber,
              body: replyBody,
              businessId: biz.id,
              templateType: "owner_notify",
            });
            sent++;
          }
        } catch (err) {
          reportError("Morning briefing failed for business", err, {
            extra: { businessId: biz.id },
          });
        }
      }

      return NextResponse.json({
        sent,
        skipped,
        total: activeBusinesses.length,
      });
    } catch (error) {
      reportError("[cron/morning-briefing] Failed", error);
      return NextResponse.json(
        { error: "Internal error" },
        { status: 500 },
      );
    }
  });
}
