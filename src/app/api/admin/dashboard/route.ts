import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, prospects, demos, calls, businesses, prospectAuditCalls, prospectOutreach, consentRecords, dataDeletionRequests, outboundCalls } from "@/db/schema";
import { sql, eq, gte, gt, and, isNull } from "drizzle-orm";
import { getLocationMrr, type PlanType } from "@/lib/stripe-prices";

export async function GET() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    prospectCounts,
    auditStats,
    outreachStats,
    demoStats,
    businessCount,
    callStats,
    consentCount,
    dsarStats,
    disclosureStats,
    outboundStats,
    accountStats,
    multiLocationStats,
    onboardingFunnel,
  ] = await Promise.all([
    // Prospect counts by status
    db
      .select({
        status: prospects.status,
        count: sql<number>`count(*)`,
      })
      .from(prospects)
      .groupBy(prospects.status),

    // Audit call stats
    db
      .select({
        total: sql<number>`count(*)`,
        answered: sql<number>`sum(case when ${prospectAuditCalls.status} = 'completed' then 1 else 0 end)`,
        missed: sql<number>`sum(case when ${prospectAuditCalls.status} = 'no-answer' then 1 else 0 end)`,
      })
      .from(prospectAuditCalls),

    // Outreach stats
    db
      .select({
        total: sql<number>`count(*)`,
        opened: sql<number>`sum(case when ${prospectOutreach.status} = 'opened' then 1 else 0 end)`,
        clicked: sql<number>`sum(case when ${prospectOutreach.status} = 'clicked' then 1 else 0 end)`,
      })
      .from(prospectOutreach),

    // Demo stats
    db
      .select({
        total: sql<number>`count(*)`,
        scheduled: sql<number>`sum(case when ${demos.status} = 'scheduled' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${demos.status} = 'completed' then 1 else 0 end)`,
        converted: sql<number>`sum(case when ${demos.status} = 'converted' then 1 else 0 end)`,
      })
      .from(demos),

    // Active businesses
    db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(eq(businesses.active, true)),

    // Calls in last 30 days
    db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
      })
      .from(calls)
      .where(gte(calls.createdAt, thirtyDaysAgo)),

    // Compliance stats
    db
      .select({ count: sql<number>`count(*)` })
      .from(consentRecords),

    db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`sum(case when ${dataDeletionRequests.status} in ('received', 'verified', 'processing') then 1 else 0 end)`,
      })
      .from(dataDeletionRequests),

    // Disclosure rate
    db
      .select({
        total: sql<number>`count(*)`,
        disclosed: sql<number>`sum(case when ${calls.recordingDisclosed} = 1 then 1 else 0 end)`,
      })
      .from(calls)
      .where(gte(calls.createdAt, thirtyDaysAgo)),

    // Outbound call stats
    db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${outboundCalls.status} = 'completed' then 1 else 0 end)`,
        answered: sql<number>`sum(case when ${outboundCalls.outcome} = 'answered' then 1 else 0 end)`,
        scheduled: sql<number>`sum(case when ${outboundCalls.status} in ('scheduled', 'retry') then 1 else 0 end)`,
      })
      .from(outboundCalls),

    // Account metrics
    db
      .select({ count: sql<number>`count(*)` })
      .from(accounts),

    // Multi-location accounts (more than 1 location)
    db
      .select({
        count: sql<number>`count(*)`,
        totalLocations: sql<number>`sum(${accounts.locationCount})`,
      })
      .from(accounts)
      .where(gt(accounts.locationCount, 1)),

    // Onboarding funnel — businesses that haven't completed onboarding
    db
      .select({
        step: businesses.onboardingStep,
        count: sql<number>`count(*)`,
      })
      .from(businesses)
      .where(isNull(businesses.onboardingCompletedAt))
      .groupBy(businesses.onboardingStep),
  ]);

  const prospectsByStatus: Record<string, number> = {};
  for (const row of prospectCounts) {
    prospectsByStatus[row.status] = row.count;
  }

  const totalProspects = Object.values(prospectsByStatus).reduce((a, b) => a + b, 0);

  // Calculate location MRR
  const multiLocCount = multiLocationStats[0]?.count ?? 0;
  const totalExtraLocations = (multiLocationStats[0]?.totalLocations ?? 0) - multiLocCount;
  const locationMrr = totalExtraLocations * getLocationMrr("monthly"); // approximate

  return NextResponse.json({
    prospects: {
      total: totalProspects,
      byStatus: prospectsByStatus,
    },
    audit: auditStats[0] ?? { total: 0, answered: 0, missed: 0 },
    outreach: outreachStats[0] ?? { total: 0, opened: 0, clicked: 0 },
    demos: demoStats[0] ?? { total: 0, scheduled: 0, completed: 0, converted: 0 },
    businesses: businessCount[0]?.count ?? 0,
    calls: callStats[0] ?? { total: 0, completed: 0 },
    compliance: {
      totalConsents: consentCount[0]?.count ?? 0,
      dsarPending: dsarStats[0]?.pending ?? 0,
      dsarTotal: dsarStats[0]?.total ?? 0,
      disclosureRate: disclosureStats[0]?.total
        ? Math.round(((disclosureStats[0]?.disclosed ?? 0) / disclosureStats[0].total) * 100)
        : 100,
    },
    outbound: {
      total: outboundStats[0]?.total ?? 0,
      completed: outboundStats[0]?.completed ?? 0,
      answered: outboundStats[0]?.answered ?? 0,
      scheduled: outboundStats[0]?.scheduled ?? 0,
    },
    accounts: {
      total: accountStats[0]?.count ?? 0,
      multiLocation: multiLocCount,
      totalLocations: businessCount[0]?.count ?? 0,
      locationMrr: Math.round(locationMrr / 100),
    },
    onboarding: {
      stuckByStep: Object.fromEntries(
        onboardingFunnel.map((row) => [String(row.step ?? 1), row.count]),
      ),
      totalIncomplete: onboardingFunnel.reduce((sum, row) => sum + row.count, 0),
    },
  });
}
