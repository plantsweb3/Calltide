import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, estimates } from "@/db/schema";
import { count, eq, sql, gte, isNull } from "drizzle-orm";

export async function GET() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [totalCustomers] = await db
    .select({ count: count() })
    .from(customers)
    .where(isNull(customers.deletedAt));

  const [repeatCustomers] = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.isRepeat, true));

  const [newThisMonth] = await db
    .select({ count: count() })
    .from(customers)
    .where(gte(customers.firstCallAt, monthStart));

  const [totalEstimates] = await db
    .select({ count: count() })
    .from(estimates);

  const [openEstimates] = await db
    .select({ count: count() })
    .from(estimates)
    .where(sql`${estimates.status} IN ('new', 'sent', 'follow_up')`);

  const [wonEstimates] = await db
    .select({
      count: count(),
      value: sql<number>`COALESCE(SUM(${estimates.amount}), 0)`,
    })
    .from(estimates)
    .where(eq(estimates.status, "won"));

  return NextResponse.json({
    totalCustomers: totalCustomers.count,
    repeatCustomers: repeatCustomers.count,
    repeatRate: totalCustomers.count > 0 ? Math.round((repeatCustomers.count / totalCustomers.count) * 100) : 0,
    newCustomersThisMonth: newThisMonth.count,
    totalEstimates: totalEstimates.count,
    openEstimates: openEstimates.count,
    wonEstimates: wonEstimates.count,
    wonEstimateValue: wonEstimates.value,
  });
}
