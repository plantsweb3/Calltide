import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import {
  accounts,
  businesses,
  paymentEvents,
  subscriptionEvents,
  processedStripeEvents,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { startDunning, clearDunning, cancelDunning } from "@/lib/financial/dunning";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { getMrrForPlan, type PlanType } from "@/lib/stripe-prices";
import { reportError } from "@/lib/error-reporting";
import { provisionTwilioNumber } from "@/lib/twilio/provision";
import { recordConsent } from "@/lib/compliance/consent";
import { getStripe } from "@/lib/stripe/client";
import { enqueueJob } from "@/lib/jobs/queue";
import { generateBookingSlug } from "@/lib/booking-slug";
import { createBusinessFromSetup } from "@/lib/onboarding/create-business";
import { sendTrialEndingEmail } from "@/lib/email/trial-ending";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    createNotification({
      source: "incident",
      severity: "critical",
      title: "Stripe webhook misconfigured",
      message: !process.env.STRIPE_WEBHOOK_SECRET
        ? "STRIPE_WEBHOOK_SECRET is not set — webhook events are being dropped. Customer signups will fail silently."
        : "Stripe webhook received without signature.",
      actionUrl: "/admin/ops",
    }).catch(() => {});
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    reportError("[stripe] Webhook signature verification failed", err);
    createNotification({
      source: "incident",
      severity: "critical",
      title: "Stripe webhook signature failed",
      message: "Webhook signature verification failed — check STRIPE_WEBHOOK_SECRET matches Stripe dashboard.",
      actionUrl: "/admin/ops",
    }).catch(() => {});
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Reject stale events (>24 hours old) to prevent replay attacks
  // Wide window so Stripe retries after outages aren't dropped — idempotency table prevents duplicates
  const eventAge = Math.floor(Date.now() / 1000) - event.created;
  if (eventAge > 86400) {
    return NextResponse.json({ error: "Event too old" }, { status: 400 });
  }

  // Atomic idempotency: INSERT OR IGNORE avoids SELECT-then-INSERT race condition.
  // Rows default to status='pending'. Only status='completed' blocks handler retries.
  const [inserted] = await db
    .insert(processedStripeEvents)
    .values({
      stripeEventId: event.id,
      eventType: event.type,
      status: "pending",
    })
    .onConflictDoNothing()
    .returning({ id: processedStripeEvents.id });

  if (!inserted) {
    // Either another instance is processing this event concurrently, or a previous
    // attempt succeeded. Skip if completed; otherwise allow handler to retry.
    const [existing] = await db
      .select({ status: processedStripeEvents.status })
      .from(processedStripeEvents)
      .where(eq(processedStripeEvents.stripeEventId, event.id))
      .limit(1);
    if (existing?.status === "completed") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Pending — allow retry. Handlers must be idempotent.
  }

  // Route event — each handler isolated so one failure doesn't block others
  const handlers: Record<string, () => Promise<void>> = {
    "invoice.payment_succeeded": () => handlePaymentSucceeded(event.data.object as Stripe.Invoice),
    "invoice.payment_failed": () => handlePaymentFailed(event.data.object as Stripe.Invoice),
    "checkout.session.completed": () => handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session),
    "customer.subscription.created": () => handleSubscriptionCreated(event.data.object as Stripe.Subscription),
    "customer.subscription.updated": () => handleSubscriptionUpdated(event.data.object as Stripe.Subscription),
    "customer.subscription.deleted": () => handleSubscriptionDeleted(event.data.object as Stripe.Subscription),
    "charge.refunded": () => handleChargeRefunded(event.data.object as Stripe.Charge),
    "charge.dispute.created": () => handleDisputeCreated(event.data.object as Stripe.Dispute),
    "charge.dispute.closed": () => handleDisputeClosed(event.data.object as Stripe.Dispute),
    "customer.subscription.trial_will_end": () => handleTrialWillEnd(event.data.object as Stripe.Subscription),
    "invoice.voided": () => handleInvoiceVoided(event.data.object as Stripe.Invoice),
    "invoice.marked_uncollectible": () => handleInvoiceUncollectible(event.data.object as Stripe.Invoice),
  };
  const handler = handlers[event.type];

  if (handler) {
    try {
      await handler();
      // Mark completed so future retries for this event short-circuit.
      await db
        .update(processedStripeEvents)
        .set({ status: "completed" })
        .where(eq(processedStripeEvents.stripeEventId, event.id));
    } catch (err) {
      reportError(`[stripe] Error handling ${event.type}`, err, {
        extra: { eventId: event.id, eventType: event.type },
      });
      createNotification({
        source: "incident",
        severity: "critical",
        title: `Stripe webhook handler failed: ${event.type}`,
        message: `Event ${event.id} (${event.type}) failed to process. Error: ${err instanceof Error ? err.message : "Unknown"}. Customer data may not have been created.`,
        actionUrl: "/admin/ops",
      }).catch(() => {});

      // For critical events, return 500 so Stripe retries. Idempotency row stays
      // at status='pending' so the retry passes our dedupe gate; handlers must be
      // idempotent (check for existing rows before insert).
      const criticalEvents = ["checkout.session.completed", "invoice.payment_succeeded", "invoice.payment_failed"];
      if (criticalEvents.includes(event.type)) {
        return NextResponse.json({ error: "Handler failed" }, { status: 500 });
      }
      // Non-critical events: return 200 to prevent unnecessary retries. Mark
      // completed so we don't reprocess on a later replay.
      await db
        .update(processedStripeEvents)
        .set({ status: "completed" })
        .where(eq(processedStripeEvents.stripeEventId, event.id))
        .catch(() => {});
    }
  } else {
    // No handler for this event type — still mark as processed.
    await db
      .update(processedStripeEvents)
      .set({ status: "completed" })
      .where(eq(processedStripeEvents.stripeEventId, event.id))
      .catch(() => {});
  }

  return NextResponse.json({ received: true });
}

// ── Event Handlers ──

async function findBusinessByCustomer(customerId: string) {
  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.stripeCustomerId, customerId))
    .limit(1);
  return biz;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id;
  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : (session.subscription as Stripe.Subscription | null)?.id;
  const email = session.customer_email || session.metadata?.email;

  if (!customerId || !email) return;

  // Detect plan from session metadata
  const plan = (session.metadata?.plan === "annual" ? "annual" : "monthly") as PlanType;
  const mrr = getMrrForPlan(plan);

  // Fetch real subscription status (will be "trialing" for trial subs)
  let subStatus: string = "active";
  let trialEndsAt: string | undefined;
  if (subscriptionId) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      subStatus = sub.status; // "trialing", "active", etc.
      if (sub.trial_end) {
        trialEndsAt = new Date(sub.trial_end * 1000).toISOString();
      }
    } catch {
      // Fall back to "active" if retrieval fails
    }
  }

  // ── Setup Page Flow ──
  // If this checkout came from /setup, create a fully-populated business from setup session data
  if (session.metadata?.source === "setup_page" && session.metadata?.setupSessionId) {
    await handleSetupPageCheckout(session, customerId, subscriptionId || undefined, email, plan, mrr, subStatus, trialEndsAt);
    return;
  }

  // Check if business already exists for this customer — reactivate if canceled
  const existing = await findBusinessByCustomer(customerId);
  if (existing) {
    await db
      .update(businesses)
      .set({
        stripeSubscriptionId: subscriptionId || undefined,
        stripeSubscriptionStatus: subStatus,
        paymentStatus: "active",
        active: true,
        planType: plan,
        mrr,
        trialEndsAt,
        annualConvertedAt: plan === "annual" ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, existing.id));
    if (existing.accountId) {
      await db
        .update(accounts)
        .set({ stripeSubscriptionId: subscriptionId || undefined, stripeSubscriptionStatus: subStatus, planType: plan, updatedAt: new Date().toISOString() })
        .where(eq(accounts.id, existing.accountId));
    }
    await logActivity({
      type: "subscription_reactivated",
      entityType: "business",
      entityId: existing.id,
      title: `${existing.name} resubscribed`,
      detail: `Customer reactivated via new checkout. Plan: ${plan}.`,
    });
    await createNotification({
      source: "financial",
      severity: "info",
      title: "Customer resubscribed",
      message: `${existing.name} (${email}) resubscribed on ${plan} plan.`,
      actionUrl: "/admin/billing",
    });
    return;
  }

  // Also check by email to prevent duplicates
  const [existingByEmail] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerEmail, email))
    .limit(1);
  if (existingByEmail) {
    // Link Stripe IDs to existing business
    await db
      .update(businesses)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId || undefined,
        stripeSubscriptionStatus: subStatus,
        paymentStatus: "active",
        planType: plan,
        mrr,
        trialEndsAt,
        annualConvertedAt: plan === "annual" ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, existingByEmail.id));

    // Create account if business doesn't have one yet
    const [biz] = await db
      .select({ accountId: businesses.accountId, ownerName: businesses.ownerName, ownerPhone: businesses.ownerPhone })
      .from(businesses)
      .where(eq(businesses.id, existingByEmail.id))
      .limit(1);

    if (biz && !biz.accountId) {
      const newAccountId = crypto.randomUUID();
      await db.insert(accounts).values({
        id: newAccountId,
        ownerName: biz.ownerName || "",
        ownerEmail: email,
        ownerPhone: biz.ownerPhone || "",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId || undefined,
        stripeSubscriptionStatus: subStatus,
        planType: plan,
        locationCount: 1,
      });
      await db
        .update(businesses)
        .set({ accountId: newAccountId, locationName: "Main", isPrimaryLocation: true, locationOrder: 0 })
        .where(eq(businesses.id, existingByEmail.id));
    }

    // Record consent for existing business linking to Stripe
    recordConsentForCheckout(existingByEmail.id).catch((err) =>
      reportError("Failed to record consent (existing biz)", err, { extra: { businessId: existingByEmail.id } })
    );

    // Provision Twilio number if the existing business doesn't have one
    const [bizForPhone] = await db
      .select({ id: businesses.id, twilioNumber: businesses.twilioNumber })
      .from(businesses)
      .where(eq(businesses.id, existingByEmail.id))
      .limit(1);
    if (bizForPhone && !bizForPhone.twilioNumber) {
      provisionTwilioNumber(bizForPhone.id).catch(async (err) => {
        reportError("Failed to auto-provision Twilio number (existing biz)", err, { extra: { businessId: bizForPhone.id } });
        await enqueueJob("twilio_provision", { businessId: bizForPhone.id }).catch(() => {});
      });
    }
    return;
  }

  // Create account + business record from checkout — wrapped in transaction
  // to prevent partial state (e.g., account created but business insert fails)
  const genericSlug = await generateBookingSlug("My Business").catch(() => undefined);
  const accountId = crypto.randomUUID();

  const newBizResult = await db.transaction(async (tx) => {
    await tx.insert(accounts).values({
      id: accountId,
      ownerName: "",
      ownerEmail: email,
      ownerPhone: "",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId || undefined,
      stripeSubscriptionStatus: subStatus,
      planType: plan,
      locationCount: 1,
    });

    const [created] = await tx.insert(businesses).values({
      name: "My Business", // Placeholder — updated during onboarding
      type: "general",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: email,
      twilioNumber: "", // Assigned during onboarding
      services: [],
      businessHours: {
        Mon: { open: "08:00", close: "17:00" },
        Tue: { open: "08:00", close: "17:00" },
        Wed: { open: "08:00", close: "17:00" },
        Thu: { open: "08:00", close: "17:00" },
        Fri: { open: "08:00", close: "17:00" },
      },
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId || undefined,
      stripeSubscriptionStatus: subStatus,
      paymentStatus: "active",
      planType: plan,
      mrr,
      trialEndsAt,
      annualConvertedAt: plan === "annual" ? new Date().toISOString() : undefined,
      active: false, // Activated after onboarding
      accountId,
      locationName: "Main",
      isPrimaryLocation: true,
      locationOrder: 0,
      bookingSlug: genericSlug,
    }).returning({ id: businesses.id });

    return created;
  });

  await logActivity({
    type: "signup_completed",
    entityType: "business",
    title: `New signup: ${email}`,
    detail: `Checkout completed. Subscription: ${subscriptionId || "pending"}.`,
  });

  await createNotification({
    source: "financial",
    severity: "info",
    title: "New customer signup",
    message: `${email} completed checkout. Onboarding pending.`,
    actionUrl: "/admin/billing",
  });

  // Record consent (TOS, privacy policy, DPA) — by completing checkout the user agreed
  if (newBizResult) {
    recordConsentForCheckout(newBizResult.id).catch((err) =>
      reportError("Failed to record consent at checkout", err, { extra: { businessId: newBizResult.id } })
    );

    // Auto-provision a Twilio phone number for this business
    provisionTwilioNumber(newBizResult.id).catch(async (err) => {
      reportError("Failed to auto-provision Twilio number", err, { extra: { businessId: newBizResult.id } });
      await enqueueJob("twilio_provision", { businessId: newBizResult.id }).catch(() => {});
    });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  const amount = invoice.amount_paid ?? 0;

  // Record payment event
  await db.insert(paymentEvents).values({
    businessId: business.id,
    stripeEventId: invoice.id,
    eventType: "payment_succeeded",
    amount,
    currency: invoice.currency ?? "usd",
    status: "succeeded",
    invoiceId: invoice.id,
  });

  // Update business
  await db
    .update(businesses)
    .set({
      paymentStatus: "active",
      stripeSubscriptionStatus: "active",
      lastPaymentAt: new Date().toISOString(),
      lastPaymentAmount: amount,
      lifetimeRevenue: sql`${businesses.lifetimeRevenue} + ${amount}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, business.id));

  // Clear any active dunning
  await clearDunning(business.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  let failureCode: string | undefined;
  let failureMessage: string | undefined;

  // Extract failure info from invoice's last_finalization_error or charge
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const lastError = invoiceAny.last_finalization_error as Record<string, unknown> | null;
  if (lastError) {
    failureCode = (lastError.code as string) ?? undefined;
    failureMessage = (lastError.message as string) ?? undefined;
  }
  // Fallback: if charge is expanded (object), extract from it
  if (!failureCode && invoiceAny.charge && typeof invoiceAny.charge === "object") {
    const charge = invoiceAny.charge as Record<string, unknown>;
    failureCode = (charge.failure_code as string) ?? undefined;
    failureMessage = (charge.failure_message as string) ?? undefined;
  }

  // Record payment event
  await db.insert(paymentEvents).values({
    businessId: business.id,
    stripeEventId: invoice.id,
    eventType: "payment_failed",
    amount: invoice.amount_due ?? 0,
    currency: invoice.currency ?? "usd",
    status: "failed",
    failureCode,
    failureMessage,
    invoiceId: invoice.id,
  });

  // Start or update dunning
  await startDunning(business.id, failureCode);

  // Unified notification
  await createNotification({
    source: "financial",
    severity: "warning",
    title: "Payment failed",
    message: `${business.name} — ${failureCode ?? "unknown error"}`,
    actionUrl: "/admin/billing",
  });
}

async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  await db.insert(subscriptionEvents).values({
    businessId: business.id,
    stripeSubscriptionId: sub.id,
    changeType: "created",
    newStatus: sub.status,
    mrr: business.mrr ?? 49700,
  });

  await db
    .update(businesses)
    .set({
      stripeSubscriptionId: sub.id,
      stripeSubscriptionStatus: sub.status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, business.id));
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  const previousStatus = business.stripeSubscriptionStatus;
  const newStatus = sub.status;

  // Determine change type
  let changeType = "updated";
  if (previousStatus === "trialing" && newStatus === "active") {
    changeType = "trial_converted";
  } else if (previousStatus === "past_due" && newStatus === "active") {
    changeType = "recovered";
  } else if (newStatus === "past_due") {
    changeType = "past_due";
  } else if (newStatus === "canceled") {
    changeType = "canceled";
  }

  await db.insert(subscriptionEvents).values({
    businessId: business.id,
    stripeSubscriptionId: sub.id,
    changeType,
    previousStatus,
    newStatus,
    mrr: business.mrr ?? 49700,
  });

  // Update card details if available
  const pm = sub.default_payment_method;
  const updates: Record<string, unknown> = {
    stripeSubscriptionStatus: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (typeof pm === "object" && pm !== null && "card" in pm) {
    const card = (pm as Stripe.PaymentMethod).card;
    if (card) {
      updates.cardLast4 = card.last4;
      updates.cardExpMonth = card.exp_month;
      updates.cardExpYear = card.exp_year;
    }
  }

  const subAny = sub as unknown as Record<string, unknown>;
  if (subAny.current_period_end) {
    updates.nextBillingAt = new Date(Number(subAny.current_period_end) * 1000).toISOString();
  }

  // Detect plan changes from Stripe (e.g. portal upgrade/downgrade)
  const priceId = sub.items?.data?.[0]?.price?.id;
  if (priceId) {
    const monthlyPriceId = process.env.STRIPE_PRICE_ID;
    const annualPriceId = process.env.STRIPE_PRICE_ANNUAL;
    if (priceId === annualPriceId && business.planType !== "annual") {
      updates.planType = "annual";
      updates.mrr = getMrrForPlan("annual");
      updates.annualConvertedAt = new Date().toISOString();
    } else if (priceId === monthlyPriceId && business.planType !== "monthly") {
      updates.planType = "monthly";
      updates.mrr = getMrrForPlan("monthly");
    }
  }

  // Detect pending cancellation (cancel_at_period_end)
  if (sub.cancel_at_period_end && newStatus === "active") {
    updates.paymentStatus = "canceling";
    await createNotification({
      source: "financial",
      severity: "warning",
      title: "Cancellation pending",
      message: `${business.name} has scheduled cancellation at period end.`,
      actionUrl: "/admin/billing",
    });
  } else if (!sub.cancel_at_period_end && business.paymentStatus === "canceling") {
    // Customer un-canceled
    updates.paymentStatus = "active";
  }

  await db.update(businesses).set(updates).where(eq(businesses.id, business.id));

  // Sync status to account
  if (business.accountId) {
    const accountUpdates: Record<string, unknown> = { stripeSubscriptionStatus: newStatus, updatedAt: new Date().toISOString() };
    if (updates.planType) accountUpdates.planType = updates.planType;
    await db
      .update(accounts)
      .set(accountUpdates)
      .where(eq(accounts.id, business.accountId));
  }

  // If recovered from past_due, clear dunning
  if (changeType === "recovered") {
    await clearDunning(business.id);
  }

  // Trial converted to paid — clear trial fields and notify
  if (changeType === "trial_converted") {
    await db
      .update(businesses)
      .set({ trialEndsAt: null, trialEndingNotified: false })
      .where(eq(businesses.id, business.id));

    await createNotification({
      source: "financial",
      severity: "info",
      title: "Trial converted to paid",
      message: `${business.name} trial converted to active subscription.`,
      actionUrl: "/admin/billing",
    });

    await logActivity({
      type: "trial_converted",
      entityType: "business",
      entityId: business.id,
      title: `${business.name} converted from trial to paid`,
      detail: `Plan: ${business.planType ?? "monthly"}`,
    });
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  await db.insert(subscriptionEvents).values({
    businessId: business.id,
    stripeSubscriptionId: sub.id,
    changeType: "canceled",
    previousStatus: business.stripeSubscriptionStatus,
    newStatus: "canceled",
    mrr: business.mrr ?? 49700,
  });

  // Mark business as canceled, deactivate, set data retention hold (30 days)
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + 30);

  await db
    .update(businesses)
    .set({
      stripeSubscriptionStatus: "canceled",
      paymentStatus: "canceled",
      active: false,
      mrr: 0,
      dataRetentionHoldUntil: holdUntil.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, business.id));

  // Cancel any active dunning
  await cancelDunning(business.id);

  // Unified notification
  await createNotification({
    source: "financial",
    severity: "critical",
    title: "Subscription canceled",
    message: `${business.name} — subscription canceled, data retention hold set for 30 days`,
    actionUrl: "/admin/billing",
  });

  // Activity log
  await logActivity({
    type: "subscription_canceled",
    entityType: "business",
    entityId: business.id,
    title: `${business.name} subscription canceled`,
    detail: `Data retention hold until ${holdUntil.toISOString().slice(0, 10)}. MRR impact: $${((business.mrr ?? 49700) / 100).toFixed(0)}`,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  const refundedAmount = charge.amount_refunded ?? 0;

  await db.insert(paymentEvents).values({
    businessId: business.id,
    stripeEventId: charge.id,
    eventType: "refund",
    amount: refundedAmount,
    currency: charge.currency ?? "usd",
    status: "refunded",
  });

  // Adjust lifetime revenue
  if (refundedAmount > 0) {
    await db
      .update(businesses)
      .set({
        lifetimeRevenue: sql`MAX(0, ${businesses.lifetimeRevenue} - ${refundedAmount})`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, business.id));
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const charge = dispute.charge;
  const chargeObj = typeof charge === "string" ? null : charge;
  const customerId = chargeObj
    ? (typeof chargeObj.customer === "string" ? chargeObj.customer : chargeObj.customer?.id)
    : null;

  // If charge is just an ID string, we can't get customer — try payment_intent metadata
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  await createNotification({
    source: "financial",
    severity: "critical",
    title: "Payment dispute opened",
    message: `${business.name} — dispute for $${(dispute.amount / 100).toFixed(2)} (${dispute.reason || "unknown reason"}).`,
    actionUrl: "/admin/billing",
  });

  await logActivity({
    type: "dispute_opened",
    entityType: "business",
    entityId: business.id,
    title: `Payment dispute opened for ${business.name}`,
    detail: `Amount: $${(dispute.amount / 100).toFixed(2)}, Reason: ${dispute.reason || "unknown"}.`,
  });

  await db
    .update(businesses)
    .set({ paymentStatus: "disputed", updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, business.id));
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const charge = dispute.charge;
  const chargeObj = typeof charge === "string" ? null : charge;
  const customerId = chargeObj
    ? (typeof chargeObj.customer === "string" ? chargeObj.customer : chargeObj.customer?.id)
    : null;

  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  const won = dispute.status === "won";

  await createNotification({
    source: "financial",
    severity: won ? "info" : "warning",
    title: `Payment dispute ${won ? "won" : "lost"}`,
    message: `${business.name} — dispute for $${(dispute.amount / 100).toFixed(2)} resolved (${dispute.status}).`,
    actionUrl: "/admin/billing",
  });

  await logActivity({
    type: "dispute_closed",
    entityType: "business",
    entityId: business.id,
    title: `Payment dispute ${won ? "won" : "lost"} for ${business.name}`,
    detail: `Amount: $${(dispute.amount / 100).toFixed(2)}, Status: ${dispute.status}.${!won ? " Refund applied." : ""}`,
  });

  await db
    .update(businesses)
    .set({ paymentStatus: "active", updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, business.id));
}

async function handleInvoiceVoided(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  await db.insert(paymentEvents).values({
    businessId: business.id,
    stripeEventId: invoice.id,
    eventType: "voided",
    amount: invoice.amount_due ?? 0,
    currency: invoice.currency ?? "usd",
    status: "voided",
    invoiceId: invoice.id,
  });
}

async function handleInvoiceUncollectible(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  await db.insert(paymentEvents).values({
    businessId: business.id,
    stripeEventId: invoice.id,
    eventType: "uncollectible",
    amount: invoice.amount_due ?? 0,
    currency: invoice.currency ?? "usd",
    status: "uncollectible",
    invoiceId: invoice.id,
  });

  await startDunning(business.id, "marked_uncollectible");

  await createNotification({
    source: "financial",
    severity: "warning",
    title: "Invoice marked uncollectible",
    message: `${business.name} — invoice for $${((invoice.amount_due ?? 0) / 100).toFixed(2)} marked uncollectible.`,
    actionUrl: "/admin/billing",
  });
}

// ── Trial Will End ──

async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  // Skip if already notified
  if (business.trialEndingNotified) return;

  const daysLeft = sub.trial_end
    ? Math.max(0, Math.ceil((sub.trial_end * 1000 - Date.now()) / 86400000))
    : 3;

  // Send trial-ending email — only mark notified if email succeeds
  let emailSent = false;
  if (business.ownerEmail) {
    const lang = (business.defaultLanguage === "es" ? "es" : "en") as "en" | "es";
    emailSent = await sendTrialEndingEmail({
      to: business.ownerEmail,
      businessName: business.name,
      receptionistName: business.receptionistName || "Maria",
      daysLeft,
      lang,
    });
  }

  if (emailSent) {
    await db
      .update(businesses)
      .set({ trialEndingNotified: true, updatedAt: new Date().toISOString() })
      .where(eq(businesses.id, business.id));
  }

  await createNotification({
    source: "financial",
    severity: "info",
    title: "Trial ending soon",
    message: `${business.name} trial ends in ${daysLeft} days. Email notification sent.`,
    actionUrl: "/admin/billing",
  });
}

// ── Setup Page Checkout ──

async function handleSetupPageCheckout(
  session: Stripe.Checkout.Session,
  customerId: string,
  subscriptionId: string | undefined,
  email: string,
  plan: PlanType,
  mrr: number,
  subStatus: string,
  trialEndsAt: string | undefined,
) {
  const setupSessionId = session.metadata?.setupSessionId;
  if (!setupSessionId) return;

  await createBusinessFromSetup({
    setupSessionId,
    customerId,
    subscriptionId,
    email,
    plan,
    mrr,
    subStatus,
    trialEndsAt,
  });
}

// ── Consent Recording ──

async function recordConsentForCheckout(businessId: string): Promise<void> {
  const consentTypes = ["tos", "privacy_policy", "dpa"];
  await Promise.all(
    consentTypes.map((consentType) =>
      recordConsent({
        businessId,
        consentType,
        metadata: { method: "stripe_checkout", acceptedAt: new Date().toISOString() },
      }),
    ),
  );
}
