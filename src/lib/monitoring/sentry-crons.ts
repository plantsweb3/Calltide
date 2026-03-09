import * as Sentry from "@sentry/nextjs";

/**
 * Wraps a cron job handler with Sentry Cron Monitoring.
 * Reports check-in start, success, and failure automatically.
 *
 * Usage:
 *   return withCronMonitor("monthly-roi", "0 14 1 * *", async () => {
 *     // ... cron logic ...
 *     return NextResponse.json({ ok: true });
 *   });
 */
export async function withCronMonitor<T>(
  monitorSlug: string,
  schedule: string,
  handler: () => Promise<T>,
): Promise<T> {
  const checkInId = Sentry.captureCheckIn(
    { monitorSlug, status: "in_progress" },
    {
      schedule: { type: "crontab", value: schedule },
      maxRuntime: 10, // minutes
      checkinMargin: 5, // minutes tolerance for late check-ins
    },
  );

  try {
    const result = await handler();
    Sentry.captureCheckIn({ checkInId, monitorSlug, status: "ok" });
    return result;
  } catch (error) {
    Sentry.captureCheckIn({ checkInId, monitorSlug, status: "error" });
    throw error;
  }
}
