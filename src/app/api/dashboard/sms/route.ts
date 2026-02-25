import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { smsMessages } from "@/db/schema";
import { eq, and, or, like, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const search = req.nextUrl.searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  const baseWhere = eq(smsMessages.businessId, businessId);
  const whereClause = search
    ? and(
        baseWhere,
        or(
          like(smsMessages.fromNumber, `%${search}%`),
          like(smsMessages.toNumber, `%${search}%`),
          like(smsMessages.body, `%${search}%`),
        ),
      )
    : baseWhere;

  const [totalResult] = await db
    .select({ count: count() })
    .from(smsMessages)
    .where(whereClause);

  const rows = await db
    .select({
      id: smsMessages.id,
      direction: smsMessages.direction,
      fromNumber: smsMessages.fromNumber,
      toNumber: smsMessages.toNumber,
      body: smsMessages.body,
      templateType: smsMessages.templateType,
      status: smsMessages.status,
      createdAt: smsMessages.createdAt,
    })
    .from(smsMessages)
    .where(whereClause)
    .orderBy(desc(smsMessages.createdAt))
    .limit(limit)
    .offset(offset);

  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({ messages: rows, total, page, totalPages });
}
