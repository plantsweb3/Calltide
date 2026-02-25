import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, leads } from "@/db/schema";
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
      createdAt: calls.createdAt,
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

  return NextResponse.json({ calls: rows, total, page, totalPages });
}
