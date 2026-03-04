import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { desc, asc, eq, like, sql, and } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const SORT_COLUMN_MAP: Record<string, SQLiteColumn> = {
  createdAt: prospects.createdAt,
  businessName: prospects.businessName,
  leadScore: prospects.leadScore,
  rating: prospects.rating,
  reviewCount: prospects.reviewCount,
  status: prospects.status,
  city: prospects.city,
  state: prospects.state,
  vertical: prospects.vertical,
};

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`prospects:${ip}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);
  const url = req.nextUrl.searchParams;
  const parsedPage = parseInt(url.get("page") ?? "1", 10);
  const parsedLimit = parseInt(url.get("limit") ?? "50", 10);
  const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
  const limit = Math.min(Math.max(1, Number.isNaN(parsedLimit) ? 50 : parsedLimit), 100);
  const offset = (page - 1) * limit;
  const sortByParam = url.get("sortBy") ?? "createdAt";
  const sortColumn = SORT_COLUMN_MAP[sortByParam] ?? SORT_COLUMN_MAP.createdAt;
  const sortOrder = url.get("sortOrder") === "asc" ? "asc" : "desc";
  const status = url.get("status");
  const vertical = url.get("vertical");
  const city = url.get("city");
  const search = url.get("search");

  const conditions = [];
  if (status) conditions.push(eq(prospects.status, status));
  if (vertical) conditions.push(eq(prospects.vertical, vertical));
  if (city) conditions.push(eq(prospects.city, city));
  if (search) {
    const escaped = search.replace(/[%_]/g, "\\$&");
    conditions.push(like(prospects.businessName, `%${escaped}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderFn = sortOrder === "asc" ? asc : desc;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(prospects)
      .where(where)
      .orderBy(orderFn(sortColumn))
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
