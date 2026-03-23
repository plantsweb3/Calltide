import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import { syncAgent } from "@/lib/elevenlabs/sync-agent";
import { DEMO_BUSINESS_ID } from "../demo-data";

const progressSchema = z.object({
  step: z.number().int().min(1).max(8),
  skippedStep: z.number().int().min(1).max(8).optional(),
  status: z.enum(["not_started", "in_progress", "paywall_reached", "completed", "abandoned"]).optional(),
});

/**
 * GET /api/dashboard/onboarding
 * Returns onboarding status for the authenticated business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      onboardingStep: 8,
      onboardingStatus: "completed",
      onboardingCompletedAt: "2025-01-15T10:00:00.000Z",
      onboardingSkippedSteps: [],
      businessData: {
        name: "Garcia Plumbing & HVAC",
        type: "plumbing",
        ownerName: "Mike Garcia",
        ownerEmail: "mike@garciaplumbing.com",
        ownerPhone: "+15125550000",
        twilioNumber: "+15125550100",
        services: ["AC Repair", "Pipe Leak Repair", "Drain Cleaning", "Water Heater Install"],
        businessHours: {
          Mon: { open: "08:00", close: "17:00" },
          Tue: { open: "08:00", close: "17:00" },
          Wed: { open: "08:00", close: "17:00" },
          Thu: { open: "08:00", close: "17:00" },
          Fri: { open: "08:00", close: "17:00" },
          Sat: { open: "09:00", close: "13:00" },
          Sun: { open: "00:00", close: "00:00", closed: true },
        },
        greeting: "Thank you for calling Garcia Plumbing & HVAC, this is María.",
        greetingEs: "Gracias por llamar a Garcia Plumbing & HVAC, habla María.",
        defaultLanguage: "en",
        serviceArea: "San Antonio and surrounding areas",
        emergencyPhone: "+15125550000",
        receptionistName: "Maria",
        personalityPreset: "friendly",
      },
    });
  }

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({
    onboardingStep: biz.onboardingStep ?? 1,
    onboardingStatus: biz.onboardingStatus ?? "not_started",
    onboardingCompletedAt: biz.onboardingCompletedAt ?? null,
    onboardingStartedAt: biz.onboardingStartedAt ?? null,
    onboardingPaywallReachedAt: biz.onboardingPaywallReachedAt ?? null,
    onboardingSkippedSteps: biz.onboardingSkippedSteps ?? [],
    businessData: {
      name: biz.name,
      type: biz.type,
      ownerName: biz.ownerName,
      ownerEmail: biz.ownerEmail,
      ownerPhone: biz.ownerPhone,
      twilioNumber: biz.twilioNumber,
      services: biz.services,
      businessHours: biz.businessHours,
      greeting: biz.greeting,
      greetingEs: biz.greetingEs,
      defaultLanguage: biz.defaultLanguage,
      serviceArea: biz.serviceArea,
      emergencyPhone: biz.emergencyPhone,
      receptionistName: biz.receptionistName || "Maria",
      personalityPreset: biz.personalityPreset || "friendly",
      stripeSubscriptionStatus: biz.stripeSubscriptionStatus,
      paymentStatus: biz.paymentStatus,
    },
  });
}

/**
 * PUT /api/dashboard/onboarding
 * Updates onboarding progress for the authenticated business.
 */
export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = progressSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { step, skippedStep, status } = result.data;

  const [biz] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      onboardingSkippedSteps: businesses.onboardingSkippedSteps,
      onboardingStatus: businesses.onboardingStatus,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const skipped: number[] = (biz.onboardingSkippedSteps as number[]) ?? [];
  if (skippedStep && !skipped.includes(skippedStep)) {
    skipped.push(skippedStep);
  }

  const updates: Record<string, unknown> = {
    onboardingStep: step,
    onboardingSkippedSteps: skipped,
    updatedAt: new Date().toISOString(),
  };

  // Handle status transitions
  if (status) {
    updates.onboardingStatus = status;
  }

  // Auto-set status based on step if not explicitly provided
  if (!status) {
    if (step === 1 && (!biz.onboardingStatus || biz.onboardingStatus === "not_started")) {
      updates.onboardingStatus = "in_progress";
      updates.onboardingStartedAt = new Date().toISOString();
    }
    if (step >= 2 && biz.onboardingStatus === "not_started") {
      updates.onboardingStatus = "in_progress";
      updates.onboardingStartedAt = new Date().toISOString();
    }
  }

  // Step 6 = paywall reached
  if (step === 6 && biz.onboardingStatus !== "paywall_reached" && biz.onboardingStatus !== "completed") {
    updates.onboardingStatus = "paywall_reached";
    updates.onboardingPaywallReachedAt = new Date().toISOString();
  }

  // Mark completion when reaching final step (8)
  if (step === 8) {
    updates.onboardingCompletedAt = new Date().toISOString();
    updates.onboardingStatus = "completed";
    updates.active = true;

    await logActivity({
      type: "onboarding_completed",
      entityType: "business",
      entityId: businessId,
      title: `${biz.name} completed onboarding`,
      detail: skipped.length > 0
        ? `Skipped steps: ${skipped.join(", ")}`
        : "All steps completed",
    });

    // Create/update ElevenLabs voice agent
    syncAgent(businessId).catch(() => {});
  }

  await db
    .update(businesses)
    .set(updates)
    .where(eq(businesses.id, businessId));

  return NextResponse.json({
    success: true,
    step,
    completed: step === 8,
    skippedSteps: skipped,
  });
}
