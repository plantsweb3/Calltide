import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { seasonalServices, businesses, customers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { scheduleOutboundCall } from "@/lib/outbound/engine";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/cron/outbound-seasonal
 *
 * Schedules seasonal service reminder calls for eligible customers.
 * Runs on the 1st of each month at 11AM CT.
 * Finds businesses with seasonal reminders enabled, matches customers
 * who had the service done N months ago (based on reminderIntervalMonths).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  let scheduled = 0;
  let skipped = 0;

  try {
    // Find active seasonal services where the current month is within season
    const activeServices = await db
      .select()
      .from(seasonalServices)
      .where(eq(seasonalServices.isActive, true));

    for (const svc of activeServices) {
      try {
        // Check if current month is within season (if season bounds are set)
        if (svc.seasonStart && svc.seasonEnd) {
          if (svc.seasonStart <= svc.seasonEnd) {
            // Normal range: e.g., March(3) to October(10)
            if (currentMonth < svc.seasonStart || currentMonth > svc.seasonEnd) {
              skipped++;
              continue;
            }
          } else {
            // Wrap-around range: e.g., October(10) to March(3)
            if (currentMonth < svc.seasonStart && currentMonth > svc.seasonEnd) {
              skipped++;
              continue;
            }
          }
        }

        // Check business config
        const [biz] = await db
          .select({
            outboundEnabled: businesses.outboundEnabled,
            seasonalReminders: businesses.seasonalReminders,
            defaultLanguage: businesses.defaultLanguage,
          })
          .from(businesses)
          .where(eq(businesses.id, svc.businessId));

        if (!biz?.outboundEnabled || !biz?.seasonalReminders) {
          skipped++;
          continue;
        }

        // Find customers for this business who might need the service
        // We look at all active customers (those with prior calls)
        const eligibleCustomers = await db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.businessId, svc.businessId),
              sql`${customers.deletedAt} IS NULL`,
              sql`${customers.totalCalls} > 0`,
            ),
          );

        for (const customer of eligibleCustomers) {
          const result = await scheduleOutboundCall({
            businessId: svc.businessId,
            customerId: customer.id,
            customerPhone: customer.phone,
            callType: "seasonal_reminder",
            referenceId: svc.id,
            scheduledFor: now.toISOString(),
            language: customer.language ?? biz.defaultLanguage ?? "en",
          });

          if (result.success) {
            scheduled++;
          } else {
            skipped++;
          }
        }
      } catch (err) {
        reportError("Outbound seasonal reminder error", err, {
          extra: { serviceId: svc.id },
        });
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      servicesChecked: activeServices.length,
      scheduled,
      skipped,
    });
  } catch (error) {
    reportError("Outbound seasonal cron failed", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
