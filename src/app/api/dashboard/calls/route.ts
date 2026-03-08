import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, leads, smsMessages, appointments } from "@/db/schema";
import { eq, and, or, like, desc, count, sql, inArray } from "drizzle-orm";
import { DEMO_BUSINESS_ID, DEMO_CALLS, DEMO_TRANSCRIPTS, DEMO_RECOVERY_TIMELINES } from "../demo-data";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")), 100);
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

  try {
    const baseWhere = eq(calls.businessId, businessId);

    const escaped = search.replace(/[%_]/g, "\\$&");
    const searchCondition = search
      ? and(
          baseWhere,
          or(
            like(calls.callerPhone, `%${escaped}%`),
            like(leads.name, `%${escaped}%`),
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
        outcome: calls.outcome,
        audioUrl: calls.audioUrl,
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

    // Build recovery timelines for missed calls (batched to avoid N+1)
    const missedRows = rows.filter((r) => r.status === "missed" && r.leadId);
    const missedLeadIds = [...new Set(missedRows.map((r) => r.leadId!))];

    // Batch fetch all SMS and appointments for missed call leads in 2 queries (not 2×N)
    const allFollowUpSms = missedLeadIds.length > 0
      ? await db
          .select({
            id: smsMessages.id,
            body: smsMessages.body,
            createdAt: smsMessages.createdAt,
            direction: smsMessages.direction,
            leadId: smsMessages.leadId,
          })
          .from(smsMessages)
          .where(
            and(
              eq(smsMessages.businessId, businessId),
              inArray(smsMessages.leadId, missedLeadIds),
            ),
          )
          .orderBy(smsMessages.createdAt)
      : [];

    const allFollowUpAppts = missedLeadIds.length > 0
      ? await db
          .select({
            id: appointments.id,
            service: appointments.service,
            date: appointments.date,
            time: appointments.time,
            createdAt: appointments.createdAt,
            leadId: appointments.leadId,
          })
          .from(appointments)
          .where(
            and(
              eq(appointments.businessId, businessId),
              inArray(appointments.leadId, missedLeadIds),
            ),
          )
          .orderBy(appointments.createdAt)
      : [];

    // Group by leadId for O(1) lookup
    const smsByLead = new Map<string, typeof allFollowUpSms>();
    for (const sms of allFollowUpSms) {
      if (!sms.leadId) continue;
      const list = smsByLead.get(sms.leadId) || [];
      list.push(sms);
      smsByLead.set(sms.leadId, list);
    }
    const apptsByLead = new Map<string, typeof allFollowUpAppts>();
    for (const appt of allFollowUpAppts) {
      if (!appt.leadId) continue;
      const list = apptsByLead.get(appt.leadId) || [];
      list.push(appt);
      apptsByLead.set(appt.leadId, list);
    }

    type TimelineStep = {
      time: string;
      event: string;
      detail: string;
      status: "missed" | "action" | "reply" | "recovered";
    };

    const callsWithRecovery = rows.map((row) => {
      if (row.status !== "missed" || !row.leadId) {
        return { ...row, recoveryTimeline: null };
      }

      const followUpSms = (smsByLead.get(row.leadId!) || [])
        .filter((s) => s.createdAt >= row.createdAt)
        .slice(0, 5);
      const followUpAppt = (apptsByLead.get(row.leadId!) || [])
        .filter((a) => a.createdAt >= row.createdAt)
        .slice(0, 1);

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
    });

    return NextResponse.json({ calls: callsWithRecovery, total, page, totalPages });
  } catch (err) {
    reportError("Failed to fetch calls", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
