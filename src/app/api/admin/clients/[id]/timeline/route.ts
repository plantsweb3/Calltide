import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientSuccessLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const events = await db
    .select({
      id: clientSuccessLog.id,
      eventType: clientSuccessLog.eventType,
      eventData: clientSuccessLog.eventData,
      emailSentAt: clientSuccessLog.emailSentAt,
      emailOpenedAt: clientSuccessLog.emailOpenedAt,
      createdAt: clientSuccessLog.createdAt,
    })
    .from(clientSuccessLog)
    .where(eq(clientSuccessLog.businessId, businessId))
    .orderBy(desc(clientSuccessLog.createdAt))
    .limit(100);

  return NextResponse.json({ events });
}
