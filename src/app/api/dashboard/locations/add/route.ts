import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@/db";
import { accounts, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";
import { getLocationPriceId, getLocationMrr, type PlanType } from "@/lib/stripe-prices";

const addLocationSchema = z.object({
  locationName: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  serviceArea: z.string().max(500).optional(),
  services: z.array(z.string()).optional(),
  businessHours: z.record(z.string(), z.object({ open: z.string(), close: z.string() })).optional(),
  greeting: z.string().max(500).optional(),
});

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion });
}

const DEFAULT_HOURS: Record<string, { open: string; close: string }> = {
  Mon: { open: "08:00", close: "17:00" },
  Tue: { open: "08:00", close: "17:00" },
  Wed: { open: "08:00", close: "17:00" },
  Thu: { open: "08:00", close: "17:00" },
  Fri: { open: "08:00", close: "17:00" },
};

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  const accountId = req.headers.get("x-account-id");
  if (!businessId || !accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = addLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    // Get account
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if ((account.locationCount ?? 1) >= (account.maxLocations ?? 10)) {
      return NextResponse.json({ error: "Maximum locations reached" }, { status: 400 });
    }

    // Get primary location to copy defaults
    const [primaryBiz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const plan = (account.planType ?? "monthly") as PlanType;
    const newLocationCount = (account.locationCount ?? 1) + 1;

    // Create new business (location)
    const [newBiz] = await db
      .insert(businesses)
      .values({
        name: `${account.companyName ?? primaryBiz?.name ?? "Business"} - ${parsed.data.locationName}`,
        type: parsed.data.type || primaryBiz?.type || "general",
        ownerName: account.ownerName,
        ownerPhone: account.ownerPhone,
        ownerEmail: account.ownerEmail,
        twilioNumber: "", // Set during phone setup step
        services: parsed.data.services ?? primaryBiz?.services ?? [],
        businessHours: parsed.data.businessHours ?? primaryBiz?.businessHours ?? DEFAULT_HOURS,
        timezone: primaryBiz?.timezone ?? "America/Chicago",
        defaultLanguage: primaryBiz?.defaultLanguage ?? "en",
        greeting: parsed.data.greeting ?? null,
        serviceArea: parsed.data.serviceArea ?? null,
        active: false, // Activated after onboarding
        accountId,
        locationName: parsed.data.locationName,
        isPrimaryLocation: false,
        locationOrder: newLocationCount - 1,
        planType: plan,
        mrr: getLocationMrr(plan),
        onboardingStep: 1,
      })
      .returning();

    // Add Stripe subscription line item for additional location
    if (account.stripeSubscriptionId) {
      const locationPriceId = getLocationPriceId(plan);
      if (locationPriceId) {
        try {
          const stripe = getStripe();
          await stripe.subscriptionItems.create({
            subscription: account.stripeSubscriptionId,
            price: locationPriceId,
            quantity: 1,
            metadata: {
              type: "additional_location",
              businessId: newBiz.id,
              locationName: parsed.data.locationName,
            },
          });
        } catch (err) {
          reportError("Failed to add Stripe line item for location", err);
        }
      }
    }

    // Increment account location count
    await db
      .update(accounts)
      .set({
        locationCount: newLocationCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, accountId));

    await logActivity({
      type: "location_added",
      entityType: "business",
      entityId: newBiz.id,
      title: `New location added: ${parsed.data.locationName}`,
      detail: `Account ${account.companyName ?? account.ownerName} now has ${newLocationCount} locations`,
    });

    return NextResponse.json({ businessId: newBiz.id, locationName: parsed.data.locationName }, { status: 201 });
  } catch (err) {
    reportError("Failed to add location", err);
    return NextResponse.json({ error: "Failed to add location" }, { status: 500 });
  }
}
