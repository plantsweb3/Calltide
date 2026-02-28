import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses, outboundCalls } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const DEMO_BUSINESS_ID = "demo-client-001";

const updateSchema = z.object({
  outboundEnabled: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  estimateFollowups: z.boolean().optional(),
  seasonalReminders: z.boolean().optional(),
  outboundCallingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  outboundCallingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  outboundMaxCallsPerDay: z.number().int().min(1).max(100).optional(),
});

/**
 * GET /api/dashboard/outbound — Get outbound settings + recent calls
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Missing business ID" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      settings: {
        outboundEnabled: true,
        appointmentReminders: true,
        estimateFollowups: true,
        seasonalReminders: false,
        outboundCallingHoursStart: "09:00",
        outboundCallingHoursEnd: "18:00",
        outboundMaxCallsPerDay: 20,
      },
      recentCalls: [
        { id: "demo-1", callType: "appointment_reminder", customerPhone: "+15125551234", status: "completed", outcome: "answered", scheduledFor: new Date(Date.now() - 86400000).toISOString(), duration: 45 },
        { id: "demo-2", callType: "estimate_followup", customerPhone: "+15125555678", status: "completed", outcome: "voicemail", scheduledFor: new Date(Date.now() - 172800000).toISOString(), duration: 12 },
        { id: "demo-3", callType: "appointment_reminder", customerPhone: "+15125559012", status: "scheduled", outcome: null, scheduledFor: new Date(Date.now() + 86400000).toISOString(), duration: null },
      ],
      stats: { total: 24, completed: 18, answered: 12, noAnswer: 4, scheduled: 2 },
    });
  }

  try {
    const [biz] = await db
      .select({
        outboundEnabled: businesses.outboundEnabled,
        appointmentReminders: businesses.appointmentReminders,
        estimateFollowups: businesses.estimateFollowups,
        seasonalReminders: businesses.seasonalReminders,
        outboundCallingHoursStart: businesses.outboundCallingHoursStart,
        outboundCallingHoursEnd: businesses.outboundCallingHoursEnd,
        outboundMaxCallsPerDay: businesses.outboundMaxCallsPerDay,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId));

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Recent outbound calls
    const recentCalls = await db
      .select({
        id: outboundCalls.id,
        callType: outboundCalls.callType,
        customerPhone: outboundCalls.customerPhone,
        status: outboundCalls.status,
        outcome: outboundCalls.outcome,
        scheduledFor: outboundCalls.scheduledFor,
        duration: outboundCalls.duration,
        createdAt: outboundCalls.createdAt,
      })
      .from(outboundCalls)
      .where(eq(outboundCalls.businessId, businessId))
      .orderBy(desc(outboundCalls.createdAt))
      .limit(20);

    // Stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${outboundCalls.status} = 'completed' then 1 else 0 end)`,
        answered: sql<number>`sum(case when ${outboundCalls.outcome} = 'answered' then 1 else 0 end)`,
        noAnswer: sql<number>`sum(case when ${outboundCalls.outcome} in ('no_answer', 'busy', 'voicemail') then 1 else 0 end)`,
        scheduled: sql<number>`sum(case when ${outboundCalls.status} in ('scheduled', 'retry') then 1 else 0 end)`,
      })
      .from(outboundCalls)
      .where(eq(outboundCalls.businessId, businessId));

    return NextResponse.json({
      settings: biz,
      recentCalls,
      stats: {
        total: stats?.total ?? 0,
        completed: stats?.completed ?? 0,
        answered: stats?.answered ?? 0,
        noAnswer: stats?.noAnswer ?? 0,
        scheduled: stats?.scheduled ?? 0,
      },
    });
  } catch (error) {
    reportError("Outbound settings GET error", error, { businessId });
    return NextResponse.json({ error: "Failed to load outbound settings" }, { status: 500 });
  }
}

/**
 * PUT /api/dashboard/outbound — Update outbound settings
 */
export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Missing business ID" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await db
      .update(businesses)
      .set({ ...parsed.data, updatedAt: new Date().toISOString() })
      .where(eq(businesses.id, businessId));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Outbound settings PUT error", error, { businessId });
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
