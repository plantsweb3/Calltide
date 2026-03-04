import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, paywallEmails } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/admin/retargeting
 *
 * Returns businesses in the paywall retarget pipeline with their email history.
 */
export async function GET() {
  try {
    // Get all businesses that have reached the paywall (or been abandoned from it)
    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        type: businesses.type,
        ownerName: businesses.ownerName,
        ownerEmail: businesses.ownerEmail,
        serviceArea: businesses.serviceArea,
        receptionistName: businesses.receptionistName,
        onboardingStatus: businesses.onboardingStatus,
        onboardingPaywallReachedAt: businesses.onboardingPaywallReachedAt,
        stripeSubscriptionStatus: businesses.stripeSubscriptionStatus,
        paywallUnsubscribed: businesses.paywallUnsubscribed,
        updatedAt: businesses.updatedAt,
      })
      .from(businesses)
      .where(
        inArray(businesses.onboardingStatus, ["paywall_reached", "abandoned"]),
      )
      .orderBy(desc(businesses.onboardingPaywallReachedAt));

    // Get all paywall emails for these businesses
    const bizIds = rows.map((r) => r.id);
    const emails = bizIds.length > 0
      ? await db
          .select()
          .from(paywallEmails)
          .where(inArray(paywallEmails.businessId, bizIds))
          .orderBy(paywallEmails.emailNumber)
      : [];

    // Group emails by business
    const emailsByBiz: Record<string, typeof emails> = {};
    for (const e of emails) {
      if (!emailsByBiz[e.businessId]) emailsByBiz[e.businessId] = [];
      emailsByBiz[e.businessId].push(e);
    }

    // Also include converted businesses (completed onboarding AND have active subscription)
    // that were previously in the paywall retarget sequence
    const convertedBizIds = emails
      .map((e) => e.businessId)
      .filter((id) => !bizIds.includes(id));
    const uniqueConverted = [...new Set(convertedBizIds)];

    let convertedRows: typeof rows = [];
    if (uniqueConverted.length > 0) {
      convertedRows = await db
        .select({
          id: businesses.id,
          name: businesses.name,
          type: businesses.type,
          ownerName: businesses.ownerName,
          ownerEmail: businesses.ownerEmail,
          serviceArea: businesses.serviceArea,
          receptionistName: businesses.receptionistName,
          onboardingStatus: businesses.onboardingStatus,
          onboardingPaywallReachedAt: businesses.onboardingPaywallReachedAt,
          stripeSubscriptionStatus: businesses.stripeSubscriptionStatus,
          paywallUnsubscribed: businesses.paywallUnsubscribed,
          updatedAt: businesses.updatedAt,
        })
        .from(businesses)
        .where(inArray(businesses.id, uniqueConverted));
    }

    const allRows = [...rows, ...convertedRows];

    // Build response
    const result = allRows.map((biz) => {
      const bizEmails = emailsByBiz[biz.id] || [];
      const isConverted = biz.stripeSubscriptionStatus === "active" || biz.stripeSubscriptionStatus === "trialing";
      return {
        ...biz,
        emails: bizEmails.map((e) => ({
          emailNumber: e.emailNumber,
          templateKey: e.templateKey,
          status: e.status,
          sentAt: e.sentAt,
          openedAt: e.openedAt,
          clickedAt: e.clickedAt,
        })),
        lastEmailNumber: bizEmails.length > 0 ? Math.max(...bizEmails.map((e) => e.emailNumber)) : 0,
        converted: isConverted,
      };
    });

    // Compute summary stats
    const stats = {
      total: result.length,
      active: result.filter((r) => r.onboardingStatus === "paywall_reached" && !r.converted).length,
      converted: result.filter((r) => r.converted).length,
      abandoned: result.filter((r) => r.onboardingStatus === "abandoned").length,
      unsubscribed: result.filter((r) => r.paywallUnsubscribed).length,
      emailsSent: emails.length,
      opens: emails.filter((e) => e.openedAt).length,
      clicks: emails.filter((e) => e.clickedAt).length,
    };

    return NextResponse.json({ businesses: result, stats });
  } catch (error) {
    reportError("Admin retargeting pipeline error", error);
    return NextResponse.json({ error: "Failed to load retargeting data" }, { status: 500 });
  }
}
