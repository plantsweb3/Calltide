import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, manualTouches } from "@/db/schema";
import { sql, eq, and, like, inArray, lte, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const tab = params.get("tab") ?? "fresh";
  const page = Math.max(1, parseInt(params.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50")));
  const search = params.get("search") ?? "";
  const statusFilter = params.get("status") ?? "";
  const offset = (page - 1) * limit;

  // Build WHERE conditions based on tab
  const conditions = [];
  if (search) {
    conditions.push(like(prospects.businessName, `%${search}%`));
  }

  switch (tab) {
    case "fresh":
      conditions.push(sql`coalesce(${prospects.outreachStatus}, 'fresh') = 'fresh'`);
      break;
    case "awaiting":
      conditions.push(eq(prospects.outreachStatus, "awaiting"));
      break;
    case "follow_ups":
      conditions.push(eq(prospects.outreachStatus, "follow_up"));
      break;
    case "interested":
      conditions.push(eq(prospects.outreachStatus, "interested"));
      break;
    case "worked":
      if (statusFilter) {
        conditions.push(eq(prospects.outreachStatus, statusFilter));
      } else {
        conditions.push(
          inArray(prospects.outreachStatus, [
            "attempted",
            "demo_booked",
            "onboarded",
            "not_interested",
            "disqualified",
          ])
        );
      }
      break;
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort order based on tab
  let orderBy;
  switch (tab) {
    case "fresh":
      orderBy = desc(prospects.leadScore);
      break;
    case "awaiting":
      orderBy = desc(prospects.lastTouchAt);
      break;
    case "follow_ups":
      orderBy = asc(prospects.nextFollowUpAt);
      break;
    case "interested":
    case "worked":
    default:
      orderBy = desc(prospects.lastTouchAt);
      break;
  }

  // Count total
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(where);
  const total = countResult?.count ?? 0;

  // Fetch prospects with touch count
  const rows = await db
    .select({
      id: prospects.id,
      businessName: prospects.businessName,
      phone: prospects.phone,
      email: prospects.email,
      website: prospects.website,
      city: prospects.city,
      state: prospects.state,
      vertical: prospects.vertical,
      leadScore: prospects.leadScore,
      source: prospects.source,
      outreachStatus: prospects.outreachStatus,
      nextFollowUpAt: prospects.nextFollowUpAt,
      lastTouchAt: prospects.lastTouchAt,
      createdAt: prospects.createdAt,
      touchCount: sql<number>`(SELECT count(*) FROM manual_touches WHERE prospect_id = ${prospects.id})`,
      lastOutcome: sql<string>`(SELECT outcome FROM manual_touches WHERE prospect_id = ${prospects.id} ORDER BY created_at DESC LIMIT 1)`,
      lastNotes: sql<string>`(SELECT notes FROM manual_touches WHERE prospect_id = ${prospects.id} ORDER BY created_at DESC LIMIT 1)`,
    })
    .from(prospects)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
