import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { smsMessages } from "@/db/schema";
import { eq, and, or, like, desc, count } from "drizzle-orm";
import { DEMO_BUSINESS_ID, DEMO_SMS } from "../demo-data";
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
    let filtered = DEMO_SMS;
    if (search) {
      const q = search.toLowerCase();
      filtered = DEMO_SMS.filter(
        (m) =>
          m.fromNumber.toLowerCase().includes(q) ||
          m.toNumber.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q),
      );
    }
    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);
    return NextResponse.json({
      messages: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  try {
    const baseWhere = eq(smsMessages.businessId, businessId);
    const escaped = search.replace(/[%_]/g, "\\$&");
    const whereClause = search
      ? and(
          baseWhere,
          or(
            like(smsMessages.fromNumber, `%${escaped}%`),
            like(smsMessages.toNumber, `%${escaped}%`),
            like(smsMessages.body, `%${escaped}%`),
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
  } catch (err) {
    reportError("Failed to fetch SMS messages", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
