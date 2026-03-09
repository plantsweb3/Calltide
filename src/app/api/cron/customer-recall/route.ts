import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, customers, smsMessages, smsOptOuts } from "@/db/schema";
import { eq, and, lte, gte, sql, isNull } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { logOutreach } from "@/lib/outreach";
import { reportError } from "@/lib/error-reporting";
import { env } from "@/lib/env";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { normalizePhone } from "@/lib/compliance/sms";

const MAX_RECALLS_PER_BUSINESS = 20;
const RECALL_COOLDOWN_DAYS = 90;
const DORMANT_MIN_MONTHS = 6;
const DORMANT_MAX_MONTHS = 12;

/**
 * Determine the upcoming season based on current month.
 * Used to personalize HVAC and seasonal trade messages.
 */
function getUpcomingSeason(month: number): string {
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

/**
 * Build a trade-specific recall SMS message.
 */
function buildRecallMessage(
  customerName: string,
  businessName: string,
  businessPhone: string,
  tradeType: string,
  monthsSinceLastContact: number,
): string {
  const name = customerName || "there";
  const months = Math.round(monthsSinceLastContact);
  const currentMonth = new Date().getMonth() + 1;
  const season = getUpcomingSeason(currentMonth);

  // Match trade type to known profiles for personalized messaging
  const normalizedTrade = tradeType.toLowerCase().replace(/[^a-z_]/g, "");

  switch (normalizedTrade) {
    case "hvac":
      return `Hi ${name}, it's been ${months} months since your last service with ${businessName}. ${season} is coming — schedule your annual tune-up before the rush? Reply YES or call us at ${businessPhone}. Reply STOP to opt out.`;

    case "plumbing":
      return `Hi ${name}, ${businessName} here. Ready for your annual plumbing inspection? Prevent costly repairs before they start. Reply YES to schedule or call ${businessPhone}. Reply STOP to opt out.`;

    case "electrical":
      return `Hi ${name}, it's been ${months} months since we last helped you. ${businessName} recommends an annual electrical safety check. Reply YES to schedule or call ${businessPhone}. Reply STOP to opt out.`;

    case "pest_control":
      return `Hi ${name}, ${businessName} here. ${season} pest season is around the corner — time for your preventive treatment! Reply YES to schedule or call ${businessPhone}. Reply STOP to opt out.`;

    case "landscaping":
      return `Hi ${name}, ${businessName} here. ${season} is a great time to refresh your outdoor space. Reply YES to schedule a visit or call ${businessPhone}. Reply STOP to opt out.`;

    case "roofing":
      return `Hi ${name}, ${businessName} here. It's been ${months} months — time for a roof inspection before ${season.toLowerCase()} weather hits. Reply YES or call ${businessPhone}. Reply STOP to opt out.`;

    case "garage_door":
      return `Hi ${name}, ${businessName} here. Time for your annual garage door maintenance? Prevent breakdowns before they happen. Reply YES or call ${businessPhone}. Reply STOP to opt out.`;

    case "restoration":
      return `Hi ${name}, ${businessName} here. ${season} storm season prep — is your home protected? We offer free inspections. Reply YES or call ${businessPhone}. Reply STOP to opt out.`;

    case "general_contractor":
      return `Hi ${name}, it's been a while! ${businessName} would love to help with your next home project. Reply YES to discuss or call ${businessPhone}. Reply STOP to opt out.`;

    default:
      return `Hi ${name}, it's been a while! ${businessName} would love to help with your next project. Reply YES or call us at ${businessPhone}. Reply STOP to opt out.`;
  }
}

/**
 * GET /api/cron/customer-recall
 *
 * Sends personalized SMS recall messages to dormant customers (6-12 months since last contact).
 * Runs Tuesdays at 3 PM UTC.
 *
 * Rules:
 * - Only contacts customers whose last call/appointment was 6-12 months ago
 * - Max 20 recalls per business per run
 * - Max 1 recall per customer per 90 days (checked via smsMessages templateType)
 * - Respects SMS opt-outs (smsOptOuts table + lead-level smsOptOut)
 * - Respects TCPA via sendSMS() compliance checks
 * - Only runs for businesses with enableCustomerRecall + outboundEnabled
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

  return withCronMonitor("customer-recall", "0 15 * * 2", async () => {
    let totalSent = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let businessesProcessed = 0;

    try {
      // Find active businesses with customer recall + outbound enabled
      const activeBiz = await db
        .select()
        .from(businesses)
        .where(
          and(
            eq(businesses.active, true),
            eq(businesses.outboundEnabled, true),
            sql`COALESCE(${businesses.enableCustomerRecall}, 1) = 1`,
          ),
        );

      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - DORMANT_MIN_MONTHS);
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - DORMANT_MAX_MONTHS);
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - RECALL_COOLDOWN_DAYS);

      for (const biz of activeBiz) {
        let bizSent = 0;

        try {
          // Determine the from number: business twilio number or system default
          const fromNumber = biz.twilioNumber || env.TWILIO_PHONE_NUMBER;
          // Business phone for the CTA (the number customers should call back)
          const businessPhone = biz.ownerPhone;

          if (!businessPhone) {
            totalSkipped++;
            continue;
          }

          // Find dormant customers:
          // - Last call was 6-12 months ago
          // - Not deleted
          // - Has a phone number
          // - Has had at least 1 call (real customer, not just a lead)
          const dormantCustomers = await db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.businessId, biz.id),
                isNull(customers.deletedAt),
                sql`${customers.phone} IS NOT NULL AND ${customers.phone} != ''`,
                sql`${customers.totalCalls} > 0`,
                lte(customers.lastCallAt, sixMonthsAgo.toISOString()),
                gte(customers.lastCallAt, twelveMonthsAgo.toISOString()),
              ),
            );

          for (const customer of dormantCustomers) {
            // Enforce per-business cap
            if (bizSent >= MAX_RECALLS_PER_BUSINESS) break;

            try {
              const normalizedPhone = normalizePhone(customer.phone);

              // Check SMS opt-out (global opt-out table)
              const [optOut] = await db
                .select({ id: smsOptOuts.id })
                .from(smsOptOuts)
                .where(
                  and(
                    eq(smsOptOuts.phoneNumber, normalizedPhone),
                    isNull(smsOptOuts.reoptedInAt),
                  ),
                )
                .limit(1);

              if (optOut) {
                totalSkipped++;
                continue;
              }

              // Check 90-day cooldown: has this customer received a recall SMS recently?
              const [recentRecall] = await db
                .select({ id: smsMessages.id })
                .from(smsMessages)
                .where(
                  and(
                    eq(smsMessages.businessId, biz.id),
                    eq(smsMessages.toNumber, customer.phone),
                    eq(smsMessages.templateType, "customer_recall"),
                    gte(smsMessages.createdAt, ninetyDaysAgo.toISOString()),
                  ),
                )
                .limit(1);

              if (recentRecall) {
                totalSkipped++;
                continue;
              }

              // Calculate months since last contact
              const lastContact = new Date(customer.lastCallAt!);
              const monthsSince =
                (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

              // Build personalized message
              const messageBody = buildRecallMessage(
                customer.name || "",
                biz.name,
                businessPhone,
                biz.type,
                monthsSince,
              );

              // Send via sendSMS — this handles TCPA compliance checks internally
              const result = await sendSMS({
                to: customer.phone,
                from: fromNumber,
                body: messageBody,
                businessId: biz.id,
                templateType: "customer_recall",
              });

              if (result.success) {
                bizSent++;
                totalSent++;
              } else {
                totalErrors++;
              }
            } catch (err) {
              totalErrors++;
              reportError("[customer-recall] Error sending to customer", err, {
                extra: { businessId: biz.id, customerId: customer.id },
              });
            }
          }

          // Log outreach at business level (once per run if any were sent)
          if (bizSent > 0) {
            await logOutreach(biz.id, "customer_recall", "sms");
          }

          businessesProcessed++;
        } catch (err) {
          totalErrors++;
          reportError("[customer-recall] Error processing business", err, {
            extra: { businessId: biz.id },
          });
        }
      }

      return NextResponse.json({
        success: true,
        businessesProcessed,
        totalSent,
        totalSkipped,
        totalErrors,
      });
    } catch (err) {
      reportError("[customer-recall] Fatal error", err);
      return NextResponse.json({ error: "Customer recall cron failed" }, { status: 500 });
    }
  });
}
