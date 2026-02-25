import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, leads } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const [totalResult] = await db
    .select({ count: count() })
    .from(calls)
    .where(eq(calls.businessId, businessId));

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
    .where(eq(calls.businessId, businessId))
    .orderBy(desc(calls.createdAt))
    .limit(limit)
    .offset(offset);

  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({ calls: rows, total, page, totalPages });
}
