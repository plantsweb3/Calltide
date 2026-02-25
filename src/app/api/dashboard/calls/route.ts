import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, leads, smsMessages, appointments } from "@/db/schema";
import { eq, and, or, like, desc, count, sql } from "drizzle-orm";
import { DEMO_BUSINESS_ID, DEMO_CALLS, DEMO_TRANSCRIPTS, DEMO_RECOVERY_TIMELINES } from "../demo-data";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const search = req.nextUrl.searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  if (businessId === DEMO_BUSINESS_ID) {
    let filtered = DEMO_CALLS;
    if (search) {
      const q = search.toLowerCase();
      filtered = DEMO_CALLS.filter(
        (c) =>
          c.callerPhone?.toLowerCase().includes(q) ||
          c.leadName?.toLowerCase().includes(q),
      );
    }
    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit).map((c) => ({
      ...c,
      transcript: DEMO_TRANSCRIPTS[c.id] || null,
      recoveryTimeline: DEMO_RECOVERY_TIMELINES[c.id] || null,
    }));
    return NextResponse.json({
      calls: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  const baseWhere = eq(calls.businessId, businessId);

  const searchCondition = search
    ? and(
        baseWhere,
        or(
          like(calls.callerPhone, `%${search}%`),
          like(leads.name, `%${search}%`),
        ),
      )
    : baseWhere;

  const [totalResult] = await db
    .select({ count: count() })
    .from(calls)
    .leftJoin(leads, eq(calls.leadId, leads.id))
    .where(searchCondition);

  const rows = await db
    .select({
      id: calls.id,
      direction: calls.direction,
      callerPhone: calls.callerPhone,
      calledPhone: calls.calledPhone,
      status: calls.status,
      duration: calls.duration,
      language: calls.language,
      summary: calls.summary,
      sentiment: calls.sentiment,
      transcript: calls.transcript,
      createdAt: calls.createdAt,
      leadId: calls.leadId,
      leadName: leads.name,
    })
    .from(calls)
    .leftJoin(leads, eq(calls.leadId, leads.id))
    .where(searchCondition)
    .orderBy(desc(calls.createdAt))
    .limit(limit)
    .offset(offset);

  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  // Build recovery timelines for missed calls
  const callsWithRecovery = await Promise.all(
    rows.map(async (row) => {
      if (row.status !== "missed" || !row.leadId) {
        return { ...row, recoveryTimeline: null };
      }

      // Find SMS sent after the missed call for this lead
      const followUpSms = await db
        .select({
          id: smsMessages.id,
          body: smsMessages.body,
          createdAt: smsMessages.createdAt,
          direction: smsMessages.direction,
        })
        .from(smsMessages)
        .where(
          and(
            eq(smsMessages.businessId, businessId),
            eq(smsMessages.leadId, row.leadId!),
            sql`${smsMessages.createdAt} >= ${row.createdAt}`,
          ),
        )
        .orderBy(smsMessages.createdAt)
        .limit(5);

      // Find appointment booked after the missed call for this lead
      const followUpAppt = await db
        .select({
          id: appointments.id,
          service: appointments.service,
          date: appointments.date,
          time: appointments.time,
          createdAt: appointments.createdAt,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.businessId, businessId),
            eq(appointments.leadId, row.leadId!),
            sql`${appointments.createdAt} >= ${row.createdAt}`,
          ),
        )
        .orderBy(appointments.createdAt)
        .limit(1);

      type TimelineStep = {
        time: string;
        event: string;
        detail: string;
        status: "missed" | "action" | "reply" | "recovered";
      };

      const timeline: TimelineStep[] = [
        {
          time: row.createdAt,
          event: "Missed Call",
          detail: `Call from ${row.leadName || row.callerPhone || "unknown"}`,
          status: "missed",
        },
      ];

      for (const sms of followUpSms) {
        timeline.push({
          time: sms.createdAt,
          event: sms.direction === "outbound" ? "AI Sent SMS" : "Customer Replied",
          detail: sms.body.length > 80 ? sms.body.slice(0, 80) + "..." : sms.body,
          status: sms.direction === "outbound" ? "action" : "reply",
        });
      }

      if (followUpAppt.length > 0) {
        const appt = followUpAppt[0];
        timeline.push({
          time: appt.createdAt,
          event: "Appointment Booked",
          detail: `${appt.service} on ${appt.date} at ${appt.time}`,
          status: "recovered",
        });
      }

      return {
        ...row,
        recoveryTimeline: timeline.length > 1 ? timeline : null,
      };
    }),
  );

  return NextResponse.json({ calls: callsWithRecovery, total, page, totalPages });
}
