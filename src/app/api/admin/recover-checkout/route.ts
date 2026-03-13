import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  accounts,
  businesses,
  setupSessions,
  receptionistCustomResponses,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMrrForPlan, type PlanType } from "@/lib/stripe-prices";
import { reportError } from "@/lib/error-reporting";
import { provisionTwilioNumber } from "@/lib/twilio/provision";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { recordConsent } from "@/lib/compliance/consent";
import { getStripe } from "@/lib/stripe/client";
import { generateBookingSlug } from "@/lib/booking-slug";
import { assignReferralCode } from "@/lib/referral";

const schema = z.object({
  checkoutSessionId: z.string().startsWith("cs_").optional(),
  stripeCustomerId: z.string().startsWith("cus_").optional(),
  // Manual override fields (optional — used if Stripe data is incomplete)
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  twilioNumber: z.string().optional(),
  skipTwilioProvision: z.boolean().optional(),
}).refine((d) => d.checkoutSessionId || d.stripeCustomerId, {
  message: "Provide either checkoutSessionId or stripeCustomerId",
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const stripe = getStripe();

  try {
    // Resolve checkout session
    let customerId: string | undefined;
    let subscriptionId: string | undefined;
    let email: string | undefined;
    let plan: PlanType = "monthly";
    let setupSessionId: string | undefined;

    if (data.checkoutSessionId) {
      const session = await stripe.checkout.sessions.retrieve(data.checkoutSessionId);
      customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? undefined;
      subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as { id: string } | null)?.id ?? undefined;
      email = session.customer_email || session.metadata?.email || undefined;
      plan = (session.metadata?.plan === "annual" ? "annual" : "monthly") as PlanType;
      setupSessionId = session.metadata?.setupSessionId;
    } else if (data.stripeCustomerId) {
      customerId = data.stripeCustomerId;
      const customer = await stripe.customers.retrieve(customerId);
      if ("email" in customer && customer.email) email = customer.email;

      // Find their subscription
      const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
      if (subs.data.length > 0) {
        subscriptionId = subs.data[0].id;
        const priceId = subs.data[0].items?.data?.[0]?.price?.id;
        if (priceId === process.env.STRIPE_PRICE_ANNUAL) plan = "annual";
      }
    }

    // Apply manual overrides
    email = data.ownerEmail || email;
    if (!customerId) {
      return NextResponse.json({ error: "Could not resolve Stripe customer" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Could not resolve customer email. Provide ownerEmail." }, { status: 400 });
    }

    // Check if business already exists
    const [existingByCust] = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.stripeCustomerId, customerId))
      .limit(1);

    if (existingByCust) {
      return NextResponse.json({
        error: "Business already exists for this Stripe customer",
        businessId: existingByCust.id,
        businessName: existingByCust.name,
      }, { status: 409 });
    }

    const [existingByEmail] = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.ownerEmail, email))
      .limit(1);

    if (existingByEmail) {
      // Link Stripe IDs to existing business
      await db
        .update(businesses)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeSubscriptionStatus: "active",
          paymentStatus: "active",
          planType: plan,
          mrr: getMrrForPlan(plan),
          annualConvertedAt: plan === "annual" ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(businesses.id, existingByEmail.id));

      return NextResponse.json({
        recovered: true,
        action: "linked_existing",
        businessId: existingByEmail.id,
        businessName: existingByEmail.name,
      });
    }

    // Try to load setup session data
    let setupData: {
      businessName?: string;
      businessType?: string;
      ownerName?: string;
      ownerPhone?: string;
      receptionistName?: string;
      personalityPreset?: string;
      city?: string;
      state?: string;
      services?: string[];
      language?: string;
      faqAnswers?: Record<string, string>;
      offLimits?: Record<string, boolean>;
    } = {};

    if (setupSessionId) {
      const [ss] = await db
        .select()
        .from(setupSessions)
        .where(eq(setupSessions.id, setupSessionId))
        .limit(1);
      if (ss) {
        setupData = {
          businessName: ss.businessName || undefined,
          businessType: ss.businessType || undefined,
          ownerName: ss.ownerName || undefined,
          ownerPhone: ss.ownerPhone || undefined,
          receptionistName: ss.receptionistName || undefined,
          personalityPreset: ss.personalityPreset || undefined,
          city: ss.city || undefined,
          state: ss.state || undefined,
          services: (ss.services as string[] | null) || undefined,
          language: ss.language || undefined,
          faqAnswers: (ss.faqAnswers as Record<string, string> | null) || undefined,
          offLimits: (ss.offLimits as Record<string, boolean> | null) || undefined,
        };
      }
    }

    // Resolve final values (manual overrides > setup data > defaults)
    const businessName = data.businessName || setupData.businessName || "My Business";
    const businessType = data.businessType || setupData.businessType || "other";
    const ownerName = data.ownerName || setupData.ownerName || "";
    const ownerPhone = data.ownerPhone || setupData.ownerPhone || "";
    const mrr = getMrrForPlan(plan);
    const now = new Date().toISOString();

    const defaultHours: Record<string, { open: string; close: string }> = {
      Mon: { open: "08:00", close: "17:00" },
      Tue: { open: "08:00", close: "17:00" },
      Wed: { open: "08:00", close: "17:00" },
      Thu: { open: "08:00", close: "17:00" },
      Fri: { open: "08:00", close: "17:00" },
    };

    // Create account
    const accountId = crypto.randomUUID();
    await db.insert(accounts).values({
      id: accountId,
      ownerName,
      ownerEmail: email,
      ownerPhone,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: "active",
      planType: plan,
      locationCount: 1,
    });

    // Create business
    const slug = await generateBookingSlug(businessName).catch(() => undefined);

    const [newBiz] = await db
      .insert(businesses)
      .values({
        name: businessName,
        type: businessType,
        ownerName,
        ownerPhone,
        ownerEmail: email,
        twilioNumber: data.twilioNumber || "",
        services: setupData.services || [],
        businessHours: defaultHours,
        serviceArea:
          setupData.city && setupData.state
            ? `${setupData.city}, ${setupData.state}`
            : undefined,
        receptionistName: setupData.receptionistName || "Maria",
        personalityPreset: setupData.personalityPreset || "friendly",
        defaultLanguage: setupData.language || "en",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: "active",
        paymentStatus: "active",
        planType: plan,
        mrr,
        annualConvertedAt: plan === "annual" ? now : undefined,
        active: false, // Activated after onboarding
        accountId,
        locationName: "Main",
        isPrimaryLocation: true,
        locationOrder: 0,
        onboardingStep: 1,
        onboardingStatus: "in_progress",
        onboardingStartedAt: now,
        bookingSlug: slug,
      })
      .returning({ id: businesses.id });

    const businessId = newBiz?.id;
    if (!businessId) {
      return NextResponse.json({ error: "Failed to create business record" }, { status: 500 });
    }

    // Referral code
    assignReferralCode(businessId, businessName).catch((err) =>
      reportError("Failed to assign referral code (recovery)", err),
    );

    // Create custom responses from setup FAQ data
    if (setupData.faqAnswers) {
      const faqs = setupData.faqAnswers;
      const entries: { category: string; triggerText: string; responseText: string; sortOrder: number }[] = [];
      if (faqs.hours) entries.push({ category: "faq", triggerText: "What are your hours?", responseText: faqs.hours, sortOrder: 0 });
      if (faqs.area) entries.push({ category: "faq", triggerText: "What areas do you serve?", responseText: faqs.area, sortOrder: 1 });
      if (faqs.estimates) entries.push({ category: "faq", triggerText: "Do you offer free estimates?", responseText: faqs.estimates, sortOrder: 2 });

      for (const entry of entries) {
        await db.insert(receptionistCustomResponses).values({ businessId, ...entry });
      }
    }

    // Mark setup session as converted
    if (setupSessionId) {
      await db
        .update(setupSessions)
        .set({ status: "converted", businessId, convertedAt: now, updatedAt: now })
        .where(eq(setupSessions.id, setupSessionId));
    }

    // Record consent
    const consentTypes = ["tos", "privacy_policy", "dpa"];
    await Promise.all(
      consentTypes.map((consentType) =>
        recordConsent({
          businessId,
          consentType,
          metadata: { method: "stripe_checkout_recovery", acceptedAt: now },
        }).catch((err) => reportError("Consent recording failed (recovery)", err)),
      ),
    );

    // Auto-provision Twilio if number not provided
    if (!data.twilioNumber && !data.skipTwilioProvision) {
      provisionTwilioNumber(businessId).catch((err) =>
        reportError("Failed to auto-provision Twilio (recovery)", err, { extra: { businessId } }),
      );
    }

    await logActivity({
      type: "signup_completed",
      entityType: "business",
      entityId: businessId,
      title: `Recovered signup: ${businessName}`,
      detail: `Business created via admin checkout recovery. Email: ${email}. Plan: ${plan}.`,
    });

    await createNotification({
      source: "financial",
      severity: "info",
      title: "Customer recovered (admin)",
      message: `${businessName} — ${email} business created via checkout recovery. Plan: ${plan}.`,
      actionUrl: "/admin/billing",
    });

    return NextResponse.json({
      recovered: true,
      action: "created",
      businessId,
      businessName,
      accountId,
      plan,
      email,
      twilioNumber: data.twilioNumber || "pending_provision",
      message: "Business created successfully. Customer can now log in and complete onboarding.",
    }, { status: 201 });
  } catch (err) {
    reportError("[admin] Checkout recovery failed", err);
    return NextResponse.json(
      { error: "Recovery failed", detail: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
