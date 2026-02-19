import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, prospects, prospectAuditCalls } from "@/db/schema";
import { sql, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [callsByDay, prospectsByDay, auditsByDay] = await Promise.all([
    // Client calls per day
    db
      .select({
        date: sql<string>`date(${calls.createdAt})`.as("date"),
        count: sql<number>`count(*)`,
      })
      .from(calls)
      .where(gte(calls.createdAt, startDate))
      .groupBy(sql`date(${calls.createdAt})`)
      .orderBy(sql`date(${calls.createdAt})`),

    // Prospects scraped per day
    db
      .select({
        date: sql<string>`date(${prospects.createdAt})`.as("date"),
        count: sql<number>`count(*)`,
      })
      .from(prospects)
      .where(gte(prospects.createdAt, startDate))
      .groupBy(sql`date(${prospects.createdAt})`)
      .orderBy(sql`date(${prospects.createdAt})`),

    // Audit calls per day
    db
      .select({
        date: sql<string>`date(${prospectAuditCalls.createdAt})`.as("date"),
        count: sql<number>`count(*)`,
      })
      .from(prospectAuditCalls)
      .where(gte(prospectAuditCalls.createdAt, startDate))
      .groupBy(sql`date(${prospectAuditCalls.createdAt})`)
      .orderBy(sql`date(${prospectAuditCalls.createdAt})`),
  ]);

  return NextResponse.json({
    callsByDay,
    prospectsByDay,
    auditsByDay,
  });
}
