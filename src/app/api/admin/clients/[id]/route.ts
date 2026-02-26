import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments, smsMessages, churnRiskScores } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id));

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Call stats
    const [callStats] = await db
      .select({
        totalCalls: sql<number>`count(*)`,
        completedCalls: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
        missedCalls: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
        avgDuration: sql<number>`avg(case when ${calls.duration} > 0 then ${calls.duration} end)`,
      })
      .from(calls)
      .where(eq(calls.businessId, id));

    // Appointment stats
    const [aptStats] = await db
      .select({
        totalAppointments: sql<number>`count(*)`,
        confirmed: sql<number>`sum(case when ${appointments.status} = 'confirmed' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${appointments.status} = 'completed' then 1 else 0 end)`,
      })
      .from(appointments)
      .where(eq(appointments.businessId, id));

    // SMS stats
    const [smsStats] = await db
      .select({
        totalSms: sql<number>`count(*)`,
        sent: sql<number>`sum(case when ${smsMessages.direction} = 'outbound' then 1 else 0 end)`,
        received: sql<number>`sum(case when ${smsMessages.direction} = 'inbound' then 1 else 0 end)`,
      })
      .from(smsMessages)
      .where(eq(smsMessages.businessId, id));

    // Churn risk
    const [churnRisk] = await db
      .select()
      .from(churnRiskScores)
      .where(eq(churnRiskScores.customerId, id))
      .limit(1);

    return NextResponse.json({
      ...business,
      stats: {
        calls: {
          total: callStats?.totalCalls ?? 0,
          completed: callStats?.completedCalls ?? 0,
          missed: callStats?.missedCalls ?? 0,
          avgDuration: Math.round(callStats?.avgDuration ?? 0),
        },
        appointments: {
          total: aptStats?.totalAppointments ?? 0,
          confirmed: aptStats?.confirmed ?? 0,
          completed: aptStats?.completed ?? 0,
        },
        sms: {
          total: smsStats?.totalSms ?? 0,
          sent: smsStats?.sent ?? 0,
          received: smsStats?.received ?? 0,
        },
      },
      churnRisk: churnRisk
        ? { score: churnRisk.score, factors: churnRisk.factors }
        : null,
    });
  } catch (error) {
    console.error("Error fetching client detail:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}
