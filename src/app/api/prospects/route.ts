import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { desc, asc, eq, like, sql, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams;
  const page = parseInt(url.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(url.get("limit") ?? "50", 10), 100);
  const offset = (page - 1) * limit;
  const sortBy = url.get("sortBy") ?? "createdAt";
  const sortOrder = url.get("sortOrder") ?? "desc";
  const status = url.get("status");
  const vertical = url.get("vertical");
  const city = url.get("city");
  const search = url.get("search");

  const conditions = [];
  if (status) conditions.push(eq(prospects.status, status));
  if (vertical) conditions.push(eq(prospects.vertical, vertical));
  if (city) conditions.push(eq(prospects.city, city));
  if (search)
    conditions.push(like(prospects.businessName, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = (prospects as unknown as Record<string, unknown>)[sortBy] ?? prospects.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(prospects)
      .where(where)
      .orderBy(orderFn(sortColumn as typeof prospects.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(prospects)
      .where(where),
  ]);

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: countResult[0]?.count ?? 0,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    },
  });
}
