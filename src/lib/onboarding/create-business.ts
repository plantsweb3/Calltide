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
import { syncAgent } from "@/lib/elevenlabs/sync-agent";
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

  // Sync business hours from FAQ "hours" answer if parseable
  const businessHours = parseBusinessHoursFromSetup(setupSession);

  // Sync timezone from setup data
  const timezone = resolveTimezone(setupSession);

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
      businessHours: businessHours,
      timezone,
      serviceArea:
        setupSession.city && setupSession.state
          ? `${setupSession.city}, ${setupSession.state}`
          : undefined,
      receptionistName: setupSession.receptionistName || "Maria",
      personalityPreset: setupSession.personalityPreset || "friendly",
      elevenlabsVoiceId: setupSession.voiceId || undefined,
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

  // Create ElevenLabs voice agent
  syncAgent(businessId).catch((err) => {
    reportError("Failed to create ElevenLabs agent (setup)", err, { extra: { businessId } });
  });

  return { businessId, isExisting: false };
}

// ── Helpers: Parse business hours from setup session ──

const DEFAULT_HOURS: Record<string, { open: string; close: string }> = {
  Mon: { open: "08:00", close: "17:00" },
  Tue: { open: "08:00", close: "17:00" },
  Wed: { open: "08:00", close: "17:00" },
  Thu: { open: "08:00", close: "17:00" },
  Fri: { open: "08:00", close: "17:00" },
};

const VALID_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Kentucky/Louisville",
];

/**
 * Attempt to parse business hours from the setup session's FAQ answers.
 * Tries to extract day-time patterns from free-text like "Mon-Fri 8am-5pm, Sat 9am-1pm".
 * Falls back to default Mon-Fri 8-5 if unparseable.
 */
function parseBusinessHoursFromSetup(
  setupSession: { faqAnswers: Record<string, string> | null },
): Record<string, { open: string; close: string }> {
  const hoursText = (setupSession.faqAnswers as Record<string, string> | null)?.hours;
  if (!hoursText) return DEFAULT_HOURS;

  try {
    const hours = { ...DEFAULT_HOURS };
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const DAY_ALIASES: Record<string, string[]> = {
      Mon: ["mon", "monday", "lun", "lunes"],
      Tue: ["tue", "tues", "tuesday", "mar", "martes"],
      Wed: ["wed", "wednesday", "mie", "miercoles", "miércoles"],
      Thu: ["thu", "thur", "thurs", "thursday", "jue", "jueves"],
      Fri: ["fri", "friday", "vie", "viernes"],
      Sat: ["sat", "saturday", "sab", "sábado", "sabado"],
      Sun: ["sun", "sunday", "dom", "domingo"],
    };

    // Normalize text
    const text = hoursText.toLowerCase().trim();

    // Try to find time-range patterns: "8am-5pm" or "8:00am-5:00pm"
    const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi;

    // Detect "Mon-Fri" range patterns followed by times
    const segments = text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);

    for (const segment of segments) {
      // Check for "closed" markers
      const isClosed = /closed|cerrado/i.test(segment);

      // Find which days this segment applies to
      const affectedDays: string[] = [];

      // Check for day ranges (Mon-Fri)
      const rangeMatch = segment.match(/([a-záéíóúñü]+)\s*[-–]+\s*([a-záéíóúñü]+)/i);
      if (rangeMatch) {
        const startDay = findDay(rangeMatch[1], DAY_ALIASES, DAYS);
        const endDay = findDay(rangeMatch[2], DAY_ALIASES, DAYS);
        if (startDay !== -1 && endDay !== -1) {
          for (let i = startDay; i <= endDay; i++) {
            affectedDays.push(DAYS[i]);
          }
        }
      }

      // Check for individual day mentions
      if (affectedDays.length === 0) {
        for (const day of DAYS) {
          for (const alias of DAY_ALIASES[day]) {
            if (segment.includes(alias)) {
              affectedDays.push(day);
              break;
            }
          }
        }
      }

      if (affectedDays.length === 0) continue;

      if (isClosed) {
        // Mark as closed — no hours
        for (const day of affectedDays) {
          delete hours[day];
        }
        continue;
      }

      // Extract time range
      const timeMatch = segment.match(timePattern);
      if (timeMatch) {
        // Reset pattern lastIndex
        timePattern.lastIndex = 0;
        const fullMatch = timePattern.exec(segment);
        if (fullMatch) {
          const open24 = parseTimeTo24(fullMatch[1]);
          const close24 = parseTimeTo24(fullMatch[2]);
          if (open24 && close24) {
            for (const day of affectedDays) {
              hours[day] = { open: open24, close: close24 };
            }
          }
        }
      }
    }

    // If we managed to parse at least 1 day, use it; otherwise fall back
    if (Object.keys(hours).length > 0) return hours;
    return DEFAULT_HOURS;
  } catch {
    return DEFAULT_HOURS;
  }
}

function findDay(text: string, aliases: Record<string, string[]>, days: string[]): number {
  const lower = text.toLowerCase().trim();
  for (let i = 0; i < days.length; i++) {
    if (aliases[days[i]].some((a) => lower.startsWith(a) || a.startsWith(lower))) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse a time string like "8am", "8:30pm", "17:00" into "HH:MM" 24-hour format.
 */
function parseTimeTo24(time: string): string | null {
  const cleaned = time.trim().toLowerCase();

  // Already 24h format: "17:00"
  const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    const h = parseInt(h24Match[1], 10);
    const m = parseInt(h24Match[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  // 12h format: "8am", "8:30pm", "8 am", "8:30 pm"
  const ampmMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2] || "0", 10);
    const isPm = ampmMatch[3] === "pm";

    if (h === 12) h = isPm ? 12 : 0;
    else if (isPm) h += 12;

    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Resolve timezone from setup session data.
 * Checks for explicit timezone field, falls back to "America/Chicago".
 */
function resolveTimezone(
  setupSession: Record<string, unknown>,
): string {
  // Check if there's a timezone stored directly on the session
  const tz = setupSession.timezone as string | undefined;
  if (tz && VALID_TIMEZONES.includes(tz)) return tz;

  // Check common timezone names that might come through
  if (typeof tz === "string" && (tz.startsWith("America/") || tz.startsWith("Pacific/"))) {
    return tz;
  }

  return "America/Chicago";
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
