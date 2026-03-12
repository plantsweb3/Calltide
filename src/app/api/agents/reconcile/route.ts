import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getStripe } from "@/lib/stripe/client";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/agents/reconcile
 *
 * Daily reconciliation agent. Checks for:
 * 1. Stripe customers with active subscriptions that have no matching business
 * 2. Businesses with active status but no valid Stripe subscription
 *
 * Schedule: 0 7 * * * (daily at 7 AM UTC)
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const results: {
    orphanedStripeCustomers: string[];
    staleBusinesses: string[];
    errors: string[];
  } = {
    orphanedStripeCustomers: [],
    staleBusinesses: [],
    errors: [],
  };

  try {
    // ── Check 1: Stripe customers with no matching business ──
    // Get active subscriptions from Stripe
    const stripe = getStripe();
    let allSubscriptions: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: Stripe.SubscriptionListParams = {
        status: "active",
        limit: 100,
        expand: ["data.customer"],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const page = await stripe.subscriptions.list(params);
      allSubscriptions = allSubscriptions.concat(page.data);
      hasMore = page.has_more;
      if (page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    for (const sub of allSubscriptions) {
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) continue;

      const customerEmail =
        typeof sub.customer === "object" && sub.customer !== null && "email" in sub.customer
          ? (sub.customer as { email: string | null }).email
          : null;

      // Check if a business exists for this customer
      const [biz] = await db
        .select({ id: businesses.id, name: businesses.name })
        .from(businesses)
        .where(eq(businesses.stripeCustomerId, customerId))
        .limit(1);

      if (!biz) {
        // Also check by email
        if (customerEmail) {
          const [bizByEmail] = await db
            .select({ id: businesses.id })
            .from(businesses)
            .where(eq(businesses.ownerEmail, customerEmail))
            .limit(1);

          if (bizByEmail) {
            // Link the Stripe customer to the existing business
            await db
              .update(businesses)
              .set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: sub.id,
                stripeSubscriptionStatus: "active",
                paymentStatus: "active",
                updatedAt: new Date().toISOString(),
              })
              .where(eq(businesses.id, bizByEmail.id));

            await logActivity({
              type: "reconciliation_fix",
              entityType: "business",
              entityId: bizByEmail.id,
              title: "Auto-linked Stripe customer to existing business",
              detail: `Stripe customer ${customerId} (${customerEmail}) linked to business ${bizByEmail.id}`,
            });
            continue;
          }
        }

        // No business found at all — alert admin
        results.orphanedStripeCustomers.push(customerId);
        await createNotification({
          source: "financial",
          severity: "critical",
          title: "Orphaned Stripe customer detected",
          message: `Active subscription ${sub.id} for customer ${customerId} (${customerEmail || "no email"}) has no matching business record. Manual recovery needed.`,
          actionUrl: "/admin/billing",
        });
      }
    }

    // ── Check 2: Businesses with payment_status=active but no valid subscription ──
    const activeBusinesses = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        stripeSubscriptionId: businesses.stripeSubscriptionId,
        stripeCustomerId: businesses.stripeCustomerId,
        paymentStatus: businesses.paymentStatus,
      })
      .from(businesses)
      .where(
        and(
          eq(businesses.paymentStatus, "active"),
          sql`${businesses.stripeSubscriptionId} IS NOT NULL`,
          sql`${businesses.stripeSubscriptionId} != ''`,
        ),
      );

    for (const biz of activeBusinesses) {
      if (!biz.stripeSubscriptionId) continue;

      try {
        const sub = await stripe.subscriptions.retrieve(biz.stripeSubscriptionId);
        if (sub.status === "canceled" || sub.status === "unpaid") {
          results.staleBusinesses.push(biz.id);
          await createNotification({
            source: "financial",
            severity: "warning",
            title: "Stale business status detected",
            message: `${biz.name} shows as active but Stripe subscription is ${sub.status}. May need status update.`,
            actionUrl: "/admin/billing",
          });
        }
      } catch (err) {
        // Subscription might not exist anymore
        results.errors.push(`Failed to check subscription for ${biz.name}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }
  } catch (err) {
    reportError("[reconcile] Reconciliation agent failed", err);
    results.errors.push(err instanceof Error ? err.message : "Unknown error");
  }

  const hasIssues =
    results.orphanedStripeCustomers.length > 0 || results.staleBusinesses.length > 0;

  if (hasIssues) {
    await logActivity({
      type: "reconciliation_run",
      entityType: "system",
      title: "Reconciliation found issues",
      detail: `Orphaned Stripe: ${results.orphanedStripeCustomers.length}, Stale businesses: ${results.staleBusinesses.length}`,
    });
  }

  return NextResponse.json({
    success: true,
    ...results,
    hasIssues,
  });
}
