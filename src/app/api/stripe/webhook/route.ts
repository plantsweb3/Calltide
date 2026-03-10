import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import {
  accounts,
  businesses,
  paymentEvents,
  subscriptionEvents,
  processedStripeEvents,
  setupSessions,
  receptionistCustomResponses,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { startDunning, clearDunning, cancelDunning, sendTrialEndingEmail } from "@/lib/financial/dunning";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { getMrrForPlan, type PlanType } from "@/lib/stripe-prices";
import { reportError } from "@/lib/error-reporting";
import { provisionTwilioNumber } from "@/lib/twilio/provision";
import { recordConsent } from "@/lib/compliance/consent";
import { getStripe } from "@/lib/stripe/client";
import { enqueueJob } from "@/lib/jobs/queue";
import { generateBookingSlug } from "@/lib/booking-slug";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    reportError("[stripe] Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Atomic idempotency: INSERT OR IGNORE avoids SELECT-then-INSERT race condition
  const [inserted] = await db
    .insert(processedStripeEvents)
    .values({
      stripeEventId: event.id,
      eventType: event.type,
    })
    .onConflictDoNothing()
    .returning({ id: processedStripeEvents.id });

  if (!inserted) {
    return NextResponse.json({ received: true, duplicate: true });
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
    "customer.subscription.trial_will_end": () => handleTrialWillEnd(event.data.object as Stripe.Subscription),
  };
  const handler = handlers[event.type];

  if (handler) {
    try {
      await handler();
    } catch (err) {
      reportError(`[stripe] Error handling ${event.type}`, err, {
        extra: { eventId: event.id, eventType: event.type },
      });
      // Still return 200 — we've recorded the event, don't want Stripe to retry
    }
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

  // ── Setup Page Flow ──
  // If this checkout came from /setup, create a fully-populated business from setup session data
  if (session.metadata?.source === "setup_page" && session.metadata?.setupSessionId) {
    await handleSetupPageCheckout(session, customerId, subscriptionId || undefined, email, plan, mrr);
    return;
  }

  // Check if business already exists for this customer
  const existing = await findBusinessByCustomer(customerId);
  if (existing) return;

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
        stripeSubscriptionStatus: "trialing",
        paymentStatus: "active",
        planType: plan,
        mrr,
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
        stripeSubscriptionStatus: "trialing",
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

  // Create account + business record from checkout
  const accountId = crypto.randomUUID();
  await db.insert(accounts).values({
    id: accountId,
    ownerName: "",
    ownerEmail: email,
    ownerPhone: "",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId || undefined,
    stripeSubscriptionStatus: "trialing",
    planType: plan,
    locationCount: 1,
  });

  const genericSlug = await generateBookingSlug("My Business").catch(() => undefined);

  await db.insert(businesses).values({
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
    stripeSubscriptionStatus: "trialing",
    paymentStatus: "active",
    planType: plan,
    mrr,
    annualConvertedAt: plan === "annual" ? new Date().toISOString() : undefined,
    active: false, // Activated after onboarding
    accountId,
    locationName: "Main",
    isPrimaryLocation: true,
    locationOrder: 0,
    bookingSlug: genericSlug,
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
  const [bizForConsent] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerEmail, email))
    .limit(1);
  if (bizForConsent) {
    recordConsentForCheckout(bizForConsent.id).catch((err) =>
      reportError("Failed to record consent at checkout", err, { extra: { businessId: bizForConsent.id } })
    );
  }

  // Auto-provision a Twilio phone number for this business
  const [newBiz] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerEmail, email))
    .limit(1);
  if (newBiz) {
    provisionTwilioNumber(newBiz.id).catch(async (err) => {
      reportError("Failed to auto-provision Twilio number", err, { extra: { businessId: newBiz.id } });
      await enqueueJob("twilio_provision", { businessId: newBiz.id }).catch(() => {});
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

  // Extract failure info from invoice metadata if available
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  if (invoiceAny.charge && typeof invoiceAny.charge === "object") {
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
  if (previousStatus === "past_due" && newStatus === "active") {
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

  await db.update(businesses).set(updates).where(eq(businesses.id, business.id));

  // Sync status to account
  if (business.accountId) {
    await db
      .update(accounts)
      .set({ stripeSubscriptionStatus: newStatus, updatedAt: new Date().toISOString() })
      .where(eq(accounts.id, business.accountId));
  }

  // If recovered from past_due, clear dunning
  if (changeType === "recovered") {
    await clearDunning(business.id);
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

async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;

  const business = await findBusinessByCustomer(customerId);
  if (!business) return;

  // Skip if already notified (avoid duplicate emails)
  if (business.trialEndingNotified) return;

  // Send trial-ending email (3 days before trial expires) with call count
  await sendTrialEndingEmail(business);

  // Mark as notified
  await db
    .update(businesses)
    .set({ trialEndingNotified: true, updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, business.id));

  await createNotification({
    source: "financial",
    severity: "info",
    title: "Trial ending soon",
    message: `${business.name} — trial ends in 3 days`,
    actionUrl: "/admin/billing",
  });

  await logActivity({
    type: "trial_ending",
    entityType: "business",
    entityId: business.id,
    title: `${business.name} trial ending soon`,
    detail: "Trial-ending email sent with call count. Payment method required to continue service.",
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

// ── Setup Page Checkout ──

async function handleSetupPageCheckout(
  session: Stripe.Checkout.Session,
  customerId: string,
  subscriptionId: string | undefined,
  email: string,
  plan: PlanType,
  mrr: number,
) {
  const setupSessionId = session.metadata?.setupSessionId;
  if (!setupSessionId) return;

  // Load setup session
  const [setupSession] = await db
    .select()
    .from(setupSessions)
    .where(eq(setupSessions.id, setupSessionId))
    .limit(1);

  if (!setupSession) {
    reportError("[stripe] Setup session not found for checkout", new Error("Missing setup session"), {
      extra: { setupSessionId },
    });
    return;
  }

  // Check if business already exists for this email (prevent duplicates)
  const [existingByEmail] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerEmail, email))
    .limit(1);

  if (existingByEmail) {
    // Link Stripe IDs to existing business and update from setup data
    await db
      .update(businesses)
      .set({
        name: setupSession.businessName || undefined,
        type: setupSession.businessType || undefined,
        ownerName: setupSession.ownerName || undefined,
        ownerPhone: setupSession.ownerPhone || undefined,
        services: setupSession.services || undefined,
        receptionistName: setupSession.receptionistName || undefined,
        personalityPreset: setupSession.personalityPreset || undefined,
        serviceArea: setupSession.city && setupSession.state ? `${setupSession.city}, ${setupSession.state}` : undefined,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: "trialing",
        paymentStatus: "active",
        planType: plan,
        mrr,
        onboardingStep: 7,
        onboardingStatus: "in_progress",
        annualConvertedAt: plan === "annual" ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, existingByEmail.id));

    // Mark setup session as converted
    await db
      .update(setupSessions)
      .set({
        status: "converted",
        businessId: existingByEmail.id,
        convertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(setupSessions.id, setupSession.id));

    recordConsentForCheckout(existingByEmail.id).catch((err) =>
      reportError("Failed to record consent (setup existing)", err, { extra: { businessId: existingByEmail.id } })
    );
    return;
  }

  // Create account + business with ALL setup data pre-populated
  const accountId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Default business hours (Mon-Fri 8-5)
  const defaultHours: Record<string, { open: string; close: string }> = {
    Mon: { open: "08:00", close: "17:00" },
    Tue: { open: "08:00", close: "17:00" },
    Wed: { open: "08:00", close: "17:00" },
    Thu: { open: "08:00", close: "17:00" },
    Fri: { open: "08:00", close: "17:00" },
  };

  await db.insert(accounts).values({
    id: accountId,
    ownerName: setupSession.ownerName || "",
    ownerEmail: email,
    ownerPhone: setupSession.ownerPhone || "",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripeSubscriptionStatus: "trialing",
    planType: plan,
    locationCount: 1,
  });

  const setupSlug = await generateBookingSlug(setupSession.businessName || "My Business").catch(() => undefined);

  const [newBiz] = await db
    .insert(businesses)
    .values({
      name: setupSession.businessName || "My Business",
      type: setupSession.businessType || "other",
      ownerName: setupSession.ownerName || "",
      ownerPhone: setupSession.ownerPhone || "",
      ownerEmail: email,
      twilioNumber: "", // Provisioned async below
      services: setupSession.services || [],
      businessHours: defaultHours,
      serviceArea: setupSession.city && setupSession.state ? `${setupSession.city}, ${setupSession.state}` : undefined,
      receptionistName: setupSession.receptionistName || "Maria",
      personalityPreset: setupSession.personalityPreset || "friendly",
      defaultLanguage: setupSession.language || "en",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: "trialing",
      paymentStatus: "active",
      planType: plan,
      mrr,
      annualConvertedAt: plan === "annual" ? now : undefined,
      active: false, // Activated after phone forwarding
      accountId,
      locationName: "Main",
      isPrimaryLocation: true,
      locationOrder: 0,
      onboardingStep: 7,
      onboardingStatus: "in_progress",
      onboardingStartedAt: setupSession.createdAt,
      bookingSlug: setupSlug,
    })
    .returning({ id: businesses.id });

  const businessId = newBiz?.id;
  if (!businessId) return;

  // Create receptionist custom responses from FAQ answers
  if (setupSession.faqAnswers) {
    const faqs = setupSession.faqAnswers as Record<string, string>;
    const faqEntries: { category: string; triggerText: string; responseText: string; sortOrder: number }[] = [];
    if (faqs.hours) faqEntries.push({ category: "faq", triggerText: "What are your hours?", responseText: faqs.hours, sortOrder: 0 });
    if (faqs.area) faqEntries.push({ category: "faq", triggerText: "What areas do you serve?", responseText: faqs.area, sortOrder: 1 });
    if (faqs.estimates) faqEntries.push({ category: "faq", triggerText: "Do you offer free estimates?", responseText: faqs.estimates, sortOrder: 2 });

    for (const entry of faqEntries) {
      await db.insert(receptionistCustomResponses).values({
        businessId,
        ...entry,
      });
    }
  }

  // Create off-limits entries
  if (setupSession.offLimits) {
    const limits = setupSession.offLimits as Record<string, boolean>;
    const offLimitEntries: { triggerText: string; responseText: string; sortOrder: number }[] = [];
    if (limits.pricing) offLimitEntries.push({ triggerText: "Don't discuss pricing over the phone", responseText: "I'd be happy to have someone get back to you with pricing details. Can I take your information?", sortOrder: 0 });
    if (limits.competitors) offLimitEntries.push({ triggerText: "Don't discuss competitors", responseText: "I'm not able to speak to that, but I can tell you about what we offer. Would you like more information?", sortOrder: 1 });
    if (limits.timing) offLimitEntries.push({ triggerText: "Don't make promises about timing", responseText: "I'd rather not give you an estimate on timing that might not be accurate. Let me have our team follow up with you on that.", sortOrder: 2 });

    for (const entry of offLimitEntries) {
      await db.insert(receptionistCustomResponses).values({
        businessId,
        category: "off_limits",
        ...entry,
      });
    }
  }

  // Mark setup session as converted
  await db
    .update(setupSessions)
    .set({
      status: "converted",
      businessId,
      convertedAt: now,
      updatedAt: now,
    })
    .where(eq(setupSessions.id, setupSession.id));

  await logActivity({
    type: "signup_completed",
    entityType: "business",
    entityId: businessId,
    title: `New signup via setup page: ${email}`,
    detail: `${setupSession.businessName} (${setupSession.businessType}). Receptionist: ${setupSession.receptionistName}.`,
  });

  await createNotification({
    source: "financial",
    severity: "info",
    title: "New customer signup (setup flow)",
    message: `${setupSession.businessName} — ${email} completed setup flow. Receptionist: ${setupSession.receptionistName}.`,
    actionUrl: "/admin/billing",
  });

  // Record consent
  recordConsentForCheckout(businessId).catch((err) =>
    reportError("Failed to record consent (setup)", err, { extra: { businessId } })
  );

  // Auto-provision Twilio number
  provisionTwilioNumber(businessId).catch(async (err) => {
    reportError("Failed to auto-provision Twilio (setup)", err, { extra: { businessId } });
    await enqueueJob("twilio_provision", { businessId }).catch(() => {});
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
