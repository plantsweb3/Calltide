import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, leads } from "@/db/schema";
import { eq, and, or, like, desc, count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const search = req.nextUrl.searchParams.get("search") || "";
  const offset = (page - 1) * limit;

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
