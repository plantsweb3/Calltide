import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import { DEMO_BUSINESS_ID } from "../demo-data";

const progressSchema = z.object({
  step: z.number().int().min(1).max(8),
  skippedStep: z.number().int().min(1).max(8).optional(),
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
    onboardingCompletedAt: biz.onboardingCompletedAt ?? null,
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

  const { step, skippedStep } = result.data;

  const [biz] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      onboardingSkippedSteps: businesses.onboardingSkippedSteps,
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

  // Mark completion when reaching step 8
  if (step === 8) {
    updates.onboardingCompletedAt = new Date().toISOString();
    updates.active = true; // Activate the business

    await logActivity({
      type: "onboarding_completed",
      entityType: "business",
      entityId: businessId,
      title: `${biz.name} completed onboarding`,
      detail: skipped.length > 0
        ? `Skipped steps: ${skipped.join(", ")}`
        : "All steps completed",
    });
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
