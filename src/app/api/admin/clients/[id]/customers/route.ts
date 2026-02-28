import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { and, eq, desc, count, isNull } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1") || 1);
  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20") || 20), 100);
  const offset = (page - 1) * limit;

  const where = and(eq(customers.businessId, businessId), isNull(customers.deletedAt));

  const [totalResult] = await db
    .select({ count: count() })
    .from(customers)
    .where(where);

  const rows = await db
    .select()
    .from(customers)
    .where(where)
    .orderBy(desc(customers.lastCallAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    customers: rows,
    total: totalResult.count,
    page,
    totalPages: Math.ceil(totalResult.count / limit),
  });
}
