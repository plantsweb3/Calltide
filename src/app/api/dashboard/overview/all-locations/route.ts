import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments, customers } from "@/db/schema";
import { eq, and, sql, gte, inArray } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  const accountId = req.headers.get("x-account-id");

  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!accountId) {
    return NextResponse.json({ error: "Multi-location not enabled" }, { status: 400 });
  }

  try {
    // Get all location IDs for this account
    const locationRows = await db
      .select({ id: businesses.id, name: businesses.name, locationName: businesses.locationName, active: businesses.active })
      .from(businesses)
      .where(eq(businesses.accountId, accountId));

    const locationIds = locationRows.map((l) => l.id);

    if (locationIds.length === 0) {
      return NextResponse.json({ locations: [], totals: {} });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    // Aggregate stats across all locations
    const [callStats] = await db
      .select({
        totalCalls: sql<number>`count(*)`,
        completedCalls: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
        missedCalls: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
      })
      .from(calls)
      .where(and(inArray(calls.businessId, locationIds), gte(calls.createdAt, thirtyDaysAgo)));

    const [aptStats] = await db
      .select({
        total: sql<number>`count(*)`,
        confirmed: sql<number>`sum(case when ${appointments.status} = 'confirmed' then 1 else 0 end)`,
      })
      .from(appointments)
      .where(and(inArray(appointments.businessId, locationIds), gte(appointments.createdAt, thirtyDaysAgo)));

    const [custStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(customers)
      .where(inArray(customers.businessId, locationIds));

    // Per-location call counts
    const perLocation = await db
      .select({
        businessId: calls.businessId,
        totalCalls: sql<number>`count(*)`,
        completedCalls: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
      })
      .from(calls)
      .where(and(inArray(calls.businessId, locationIds), gte(calls.createdAt, thirtyDaysAgo)))
      .groupBy(calls.businessId);

    const perLocationMap = new Map(perLocation.map((p) => [p.businessId, p]));

    return NextResponse.json({
      locations: locationRows.map((loc) => {
        const stats = perLocationMap.get(loc.id);
        return {
          id: loc.id,
          name: loc.name,
          locationName: loc.locationName ?? "Main",
          active: loc.active,
          calls: stats?.totalCalls ?? 0,
          completedCalls: stats?.completedCalls ?? 0,
        };
      }),
      totals: {
        calls: callStats?.totalCalls ?? 0,
        completedCalls: callStats?.completedCalls ?? 0,
        missedCalls: callStats?.missedCalls ?? 0,
        appointments: aptStats?.total ?? 0,
        confirmedAppointments: aptStats?.confirmed ?? 0,
        customers: custStats?.total ?? 0,
      },
    });
  } catch (err) {
    reportError("Failed to fetch all-locations overview", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
