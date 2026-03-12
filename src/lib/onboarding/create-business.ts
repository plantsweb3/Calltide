import { db } from "@/db";
import {
  accounts,
  businesses,
  setupSessions,
  receptionistCustomResponses,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { type PlanType } from "@/lib/stripe-prices";
import { reportError } from "@/lib/error-reporting";
import { provisionTwilioNumber } from "@/lib/twilio/provision";
import { recordConsent } from "@/lib/compliance/consent";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { enqueueJob } from "@/lib/jobs/queue";
import { generateBookingSlug } from "@/lib/booking-slug";

interface CreateBusinessFromSetupParams {
  setupSessionId: string;
  customerId: string;
  subscriptionId?: string;
  email: string;
  plan: PlanType;
  mrr: number;
  /** If true, this was created via the fallback path (webhook didn't fire) */
  isFallback?: boolean;
}

interface CreateBusinessResult {
  businessId: string;
  isExisting: boolean;
}

/**
 * Shared business creation logic used by both the Stripe webhook and the
 * setup auth fallback. Extracts all data from the setup session and creates
 * account + business + custom responses + Twilio provisioning.
 */
export async function createBusinessFromSetup(
  params: CreateBusinessFromSetupParams,
): Promise<CreateBusinessResult | null> {
  const { setupSessionId, customerId, subscriptionId, email, plan, mrr, isFallback } = params;

  // Load setup session
  const [setupSession] = await db
    .select()
    .from(setupSessions)
    .where(eq(setupSessions.id, setupSessionId))
    .limit(1);

  if (!setupSession) {
    reportError("[create-business] Setup session not found", new Error("Missing setup session"), {
      extra: { setupSessionId },
    });
    return null;
  }

  // Check if already converted (idempotent)
  if (setupSession.status === "converted" && setupSession.businessId) {
    return { businessId: setupSession.businessId, isExisting: true };
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
        serviceArea:
          setupSession.city && setupSession.state
            ? `${setupSession.city}, ${setupSession.state}`
            : undefined,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: "active",
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
      reportError("Failed to record consent (setup existing)", err, {
        extra: { businessId: existingByEmail.id },
      }),
    );

    return { businessId: existingByEmail.id, isExisting: true };
  }

  // Create account + business with ALL setup data pre-populated
  const accountId = crypto.randomUUID();
  const now = new Date().toISOString();

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
    stripeSubscriptionStatus: "active",
    planType: plan,
    locationCount: 1,
  });

  const setupSlug = await generateBookingSlug(
    setupSession.businessName || "My Business",
  ).catch(() => undefined);

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
      serviceArea:
        setupSession.city && setupSession.state
          ? `${setupSession.city}, ${setupSession.state}`
          : undefined,
      receptionistName: setupSession.receptionistName || "Maria",
      personalityPreset: setupSession.personalityPreset || "friendly",
      defaultLanguage: setupSession.language || "en",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: "active",
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
  if (!businessId) return null;

  // Create receptionist custom responses from FAQ answers
  if (setupSession.faqAnswers) {
    const faqs = setupSession.faqAnswers as Record<string, string>;
    const faqEntries: {
      category: string;
      triggerText: string;
      responseText: string;
      sortOrder: number;
    }[] = [];
    if (faqs.hours)
      faqEntries.push({
        category: "faq",
        triggerText: "What are your hours?",
        responseText: faqs.hours,
        sortOrder: 0,
      });
    if (faqs.area)
      faqEntries.push({
        category: "faq",
        triggerText: "What areas do you serve?",
        responseText: faqs.area,
        sortOrder: 1,
      });
    if (faqs.estimates)
      faqEntries.push({
        category: "faq",
        triggerText: "Do you offer free estimates?",
        responseText: faqs.estimates,
        sortOrder: 2,
      });

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
    const offLimitEntries: {
      triggerText: string;
      responseText: string;
      sortOrder: number;
    }[] = [];
    if (limits.pricing)
      offLimitEntries.push({
        triggerText: "Don't discuss pricing over the phone",
        responseText:
          "I'd be happy to have someone get back to you with pricing details. Can I take your information?",
        sortOrder: 0,
      });
    if (limits.competitors)
      offLimitEntries.push({
        triggerText: "Don't discuss competitors",
        responseText:
          "I'm not able to speak to that, but I can tell you about what we offer. Would you like more information?",
        sortOrder: 1,
      });
    if (limits.timing)
      offLimitEntries.push({
        triggerText: "Don't make promises about timing",
        responseText:
          "I'd rather not give you an estimate on timing that might not be accurate. Let me have our team follow up with you on that.",
        sortOrder: 2,
      });

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

  const source = isFallback ? "webhook fallback" : "setup flow";

  await logActivity({
    type: "signup_completed",
    entityType: "business",
    entityId: businessId,
    title: `New signup via ${source}: ${email}`,
    detail: `${setupSession.businessName} (${setupSession.businessType}). Receptionist: ${setupSession.receptionistName}.`,
  });

  await createNotification({
    source: "financial",
    severity: "info",
    title: `New customer signup (${source})`,
    message: `${setupSession.businessName} — ${email} completed setup. Receptionist: ${setupSession.receptionistName}.`,
    actionUrl: "/admin/billing",
  });

  // Record consent
  recordConsentForCheckout(businessId).catch((err) =>
    reportError("Failed to record consent (setup)", err, { extra: { businessId } }),
  );

  // Auto-provision Twilio number
  provisionTwilioNumber(businessId).catch(async (err) => {
    reportError("Failed to auto-provision Twilio (setup)", err, { extra: { businessId } });
    await enqueueJob("twilio_provision", { businessId }).catch(() => {});
  });

  return { businessId, isExisting: false };
}

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
