import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import { syncAgent } from "@/lib/elevenlabs/sync-agent";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../demo-data";

const dayEnum = z.enum([
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  // Also accept short-form keys used in some existing records
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
]);

const settingsSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50).optional(),
  ownerName: z.string().min(1).max(100),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().regex(/^\+?1?\d{10,11}$/, "Invalid US phone number"),
  businessHours: z.record(
    dayEnum,
    z.object({
      open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM (24h)"),
      close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM (24h)"),
      closed: z.boolean().optional(),
    })
  ),
  services: z.array(z.string().max(50)).max(20),
  greeting: z.string().max(500).optional().or(z.literal("")),
  greetingEs: z.string().max(500).optional().or(z.literal("")),
  defaultLanguage: z.enum(["en", "es"]),
  emergencyPhone: z.string().regex(/^\+?1?\d{10,11}$/).optional().or(z.literal("")),
  serviceArea: z.string().max(200).optional().or(z.literal("")),
  additionalInfo: z.string().max(1000).optional().or(z.literal("")),
  personalityNotes: z.string().max(1000).optional().or(z.literal("")),
  receptionistName: z.string().min(1).max(20).regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]+$/).optional(),
  personalityPreset: z.enum(["professional", "friendly", "warm"]).optional(),
  enableWeeklyDigest: z.boolean().optional(),
  digestDeliveryMethod: z.enum(["email", "sms", "both"]).optional(),
  enableDailySummary: z.boolean().optional(),
  googleReviewUrl: z.string().url().max(500).optional().or(z.literal("")),
  enableReviewRequests: z.boolean().optional(),
  enableMissedCallRecovery: z.boolean().optional(),
  // Notification preferences
  notifyOnEveryCall: z.boolean().optional(),
  notifyOnMissedOnly: z.boolean().optional(),
  ownerQuietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM (24h)").optional(),
  ownerQuietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM (24h)").optional(),
  setupChecklistDismissed: z.boolean().optional(),
});

function stripHtml(str: string | undefined | null): string | undefined | null {
  if (!str) return str;
  return str.replace(/<[^>]*>/g, "");
}

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      name: "Garcia Plumbing & HVAC",
      type: "plumbing",
      ownerName: "Mike Garcia",
      ownerEmail: "mike@garciaplumbing.com",
      ownerPhone: "+15125550000",
      twilioNumber: "+15125550100",
      businessHours: {
        Mon: { open: "08:00", close: "17:00" },
        Tue: { open: "08:00", close: "17:00" },
        Wed: { open: "08:00", close: "17:00" },
        Thu: { open: "08:00", close: "17:00" },
        Fri: { open: "08:00", close: "17:00" },
        Sat: { open: "09:00", close: "13:00" },
        Sun: { open: "00:00", close: "00:00", closed: true },
      },
      services: ["AC Repair", "Pipe Leak Repair", "Drain Cleaning", "Water Heater Install"],
      greeting: "Thank you for calling Garcia Plumbing & HVAC, this is María. How can I help you today?",
      greetingEs: "Gracias por llamar a Garcia Plumbing & HVAC, habla María. ¿En qué le puedo ayudar?",
      defaultLanguage: "en",
      serviceArea: "San Antonio and surrounding areas",
      additionalInfo: "We offer same-day emergency service for plumbing and HVAC issues.",
      personalityNotes: "Be extra friendly and casual. Always mention we offer military and senior discounts. If someone asks about pricing, mention we offer free estimates.",
      emergencyPhone: "+15125559999",
      timezone: "America/Chicago",
      active: true,
      memberSince: "2025-01-15",
      receptionistName: "María",
      personalityPreset: "friendly",
      enableWeeklyDigest: true,
      digestDeliveryMethod: "both",
      enableDailySummary: true,
      googleReviewUrl: "https://g.page/r/garcia-plumbing/review",
      enableReviewRequests: true,
      enableMissedCallRecovery: true,
      notifyOnEveryCall: false,
      notifyOnMissedOnly: true,
      ownerQuietHoursStart: "21:00",
      ownerQuietHoursEnd: "08:00",
      setupChecklistDismissed: false,
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
    name: biz.name,
    type: biz.type,
    ownerName: biz.ownerName,
    ownerEmail: biz.ownerEmail,
    ownerPhone: biz.ownerPhone,
    twilioNumber: biz.twilioNumber,
    businessHours: biz.businessHours,
    services: biz.services,
    greeting: biz.greeting,
    greetingEs: biz.greetingEs,
    defaultLanguage: biz.defaultLanguage,
    serviceArea: biz.serviceArea,
    additionalInfo: biz.additionalInfo,
    personalityNotes: biz.personalityNotes,
    emergencyPhone: biz.emergencyPhone,
    timezone: biz.timezone,
    active: biz.active,
    memberSince: biz.createdAt.slice(0, 10),
    receptionistName: biz.receptionistName || "Maria",
    personalityPreset: biz.personalityPreset || "friendly",
    enableWeeklyDigest: biz.enableWeeklyDigest ?? true,
    digestDeliveryMethod: biz.digestDeliveryMethod ?? "both",
    enableDailySummary: biz.enableDailySummary ?? true,
    googleReviewUrl: biz.googleReviewUrl || "",
    enableReviewRequests: biz.enableReviewRequests ?? true,
    enableMissedCallRecovery: biz.enableMissedCallRecovery ?? true,
    notifyOnEveryCall: biz.notifyOnEveryCall ?? false,
    notifyOnMissedOnly: biz.notifyOnMissedOnly ?? true,
    ownerQuietHoursStart: biz.ownerQuietHoursStart || "21:00",
    ownerQuietHoursEnd: biz.ownerQuietHoursEnd || "08:00",
    setupChecklistDismissed: biz.setupChecklistDismissed ?? false,
  });
}

export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`settings-write:${businessId}`, { limit: 30, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — changes not saved" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Handle simple flag updates (e.g., dismiss setup checklist) without requiring all fields
  if (typeof body === "object" && body !== null && Object.keys(body as Record<string, unknown>).length === 1) {
    const obj = body as Record<string, unknown>;
    if (obj.setupChecklistDismissed === true) {
      await db.update(businesses).set({ setupChecklistDismissed: true, updatedAt: new Date().toISOString() }).where(eq(businesses.id, businessId));
      return NextResponse.json({ success: true });
    }
    if (obj.tourCompleted === true) {
      await db.update(businesses).set({ tourCompleted: true, updatedAt: new Date().toISOString() }).where(eq(businesses.id, businessId));
      return NextResponse.json({ success: true });
    }
  }

  const result = settingsSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 }
    );
  }

  const data = result.data;

  // Verify business exists
  const [biz] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Sanitize string inputs
  const sanitized: Record<string, unknown> = {
    name: stripHtml(data.name)!,
    ...(data.type ? { type: stripHtml(data.type)! } : {}),
    ownerName: stripHtml(data.ownerName)!,
    ownerEmail: data.ownerEmail,
    ownerPhone: data.ownerPhone,
    businessHours: data.businessHours,
    services: data.services.map((s) => stripHtml(s)!),
    greeting: stripHtml(data.greeting) || null,
    greetingEs: stripHtml(data.greetingEs) || null,
    defaultLanguage: data.defaultLanguage,
    emergencyPhone: data.emergencyPhone || null,
    serviceArea: stripHtml(data.serviceArea) || null,
    additionalInfo: stripHtml(data.additionalInfo) || null,
    personalityNotes: stripHtml(data.personalityNotes) || null,
    ...(data.receptionistName ? { receptionistName: stripHtml(data.receptionistName)! } : {}),
    ...(data.personalityPreset ? { personalityPreset: data.personalityPreset } : {}),
    ...(data.enableWeeklyDigest !== undefined ? { enableWeeklyDigest: data.enableWeeklyDigest } : {}),
    ...(data.digestDeliveryMethod ? { digestDeliveryMethod: data.digestDeliveryMethod } : {}),
    ...(data.enableDailySummary !== undefined ? { enableDailySummary: data.enableDailySummary } : {}),
    ...(data.googleReviewUrl !== undefined ? { googleReviewUrl: data.googleReviewUrl || null } : {}),
    ...(data.enableReviewRequests !== undefined ? { enableReviewRequests: data.enableReviewRequests } : {}),
    ...(data.enableMissedCallRecovery !== undefined ? { enableMissedCallRecovery: data.enableMissedCallRecovery } : {}),
    ...(data.notifyOnEveryCall !== undefined ? { notifyOnEveryCall: data.notifyOnEveryCall } : {}),
    ...(data.notifyOnMissedOnly !== undefined ? { notifyOnMissedOnly: data.notifyOnMissedOnly } : {}),
    ...(data.ownerQuietHoursStart ? { ownerQuietHoursStart: data.ownerQuietHoursStart } : {}),
    ...(data.ownerQuietHoursEnd ? { ownerQuietHoursEnd: data.ownerQuietHoursEnd } : {}),
    ...(data.setupChecklistDismissed !== undefined ? { setupChecklistDismissed: data.setupChecklistDismissed } : {}),
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(businesses)
    .set(sanitized)
    .where(eq(businesses.id, businessId));

  // Log the activity
  await logActivity({
    type: "settings_updated",
    entityType: "business",
    entityId: businessId,
    title: `Settings updated for ${sanitized.name}`,
    detail: "Client updated business settings via self-service portal",
  });

  // Sync ElevenLabs voice agent with updated settings
  syncAgent(businessId).catch(() => {});

  // Return updated business
  const [updated] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  return NextResponse.json({
    name: updated.name,
    type: updated.type,
    ownerName: updated.ownerName,
    ownerEmail: updated.ownerEmail,
    ownerPhone: updated.ownerPhone,
    twilioNumber: updated.twilioNumber,
    businessHours: updated.businessHours,
    services: updated.services,
    greeting: updated.greeting,
    greetingEs: updated.greetingEs,
    defaultLanguage: updated.defaultLanguage,
    serviceArea: updated.serviceArea,
    additionalInfo: updated.additionalInfo,
    personalityNotes: updated.personalityNotes,
    emergencyPhone: updated.emergencyPhone,
    timezone: updated.timezone,
    active: updated.active,
    memberSince: updated.createdAt.slice(0, 10),
    receptionistName: updated.receptionistName || "Maria",
    personalityPreset: updated.personalityPreset || "friendly",
    enableWeeklyDigest: updated.enableWeeklyDigest ?? true,
    digestDeliveryMethod: updated.digestDeliveryMethod ?? "both",
    enableDailySummary: updated.enableDailySummary ?? true,
    googleReviewUrl: updated.googleReviewUrl || "",
    enableReviewRequests: updated.enableReviewRequests ?? true,
    enableMissedCallRecovery: updated.enableMissedCallRecovery ?? true,
    notifyOnEveryCall: updated.notifyOnEveryCall ?? false,
    notifyOnMissedOnly: updated.notifyOnMissedOnly ?? true,
    ownerQuietHoursStart: updated.ownerQuietHoursStart || "21:00",
    ownerQuietHoursEnd: updated.ownerQuietHoursEnd || "08:00",
    setupChecklistDismissed: updated.setupChecklistDismissed ?? false,
  });
}
