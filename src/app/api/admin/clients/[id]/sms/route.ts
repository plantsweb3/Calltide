import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { smsMessages, leads } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const [totalResult] = await db
      .select({ count: count() })
      .from(smsMessages)
      .where(eq(smsMessages.businessId, businessId));

    const messages = await db
      .select({
        id: smsMessages.id,
        direction: smsMessages.direction,
        fromNumber: smsMessages.fromNumber,
        toNumber: smsMessages.toNumber,
        body: smsMessages.body,
        templateType: smsMessages.templateType,
        status: smsMessages.status,
        createdAt: smsMessages.createdAt,
        leadName: leads.name,
      })
      .from(smsMessages)
      .leftJoin(leads, eq(smsMessages.leadId, leads.id))
      .where(eq(smsMessages.businessId, businessId))
      .orderBy(desc(smsMessages.createdAt))
      .limit(limit)
      .offset(offset);

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ messages, total, page, totalPages });
  } catch (error) {
    console.error("Error fetching SMS history:", error);
    return NextResponse.json({ error: "Failed to fetch SMS history" }, { status: 500 });
  }
}
