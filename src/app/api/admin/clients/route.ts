import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const businessRows = await db.select().from(businesses);

  const results = await Promise.all(
    businessRows.map(async (biz) => {
      const [callStats] = await db
        .select({
          totalCalls: sql<number>`count(*)`,
          completedCalls: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
          missedCalls: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
        })
        .from(calls)
        .where(eq(calls.businessId, biz.id));

      const [aptStats] = await db
        .select({
          totalAppointments: sql<number>`count(*)`,
          confirmed: sql<number>`sum(case when ${appointments.status} = 'confirmed' then 1 else 0 end)`,
          completed: sql<number>`sum(case when ${appointments.status} = 'completed' then 1 else 0 end)`,
        })
        .from(appointments)
        .where(eq(appointments.businessId, biz.id));

      // Health: green if >50% calls completed, amber if 25-50%, red if <25%
      const total = callStats?.totalCalls ?? 0;
      const completed = callStats?.completedCalls ?? 0;
      const rate = total > 0 ? completed / total : 1;
      const health = rate > 0.5 ? "green" : rate > 0.25 ? "amber" : "red";

      return {
        id: biz.id,
        name: biz.name,
        type: biz.type,
        ownerName: biz.ownerName,
        ownerPhone: biz.ownerPhone,
        active: biz.active,
        createdAt: biz.createdAt,
        calls: callStats ?? { totalCalls: 0, completedCalls: 0, missedCalls: 0 },
        appointments: aptStats ?? { totalAppointments: 0, confirmed: 0, completed: 0 },
        health,
      };
    }),
  );

  return NextResponse.json(results);
}
