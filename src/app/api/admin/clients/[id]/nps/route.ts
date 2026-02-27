import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { npsResponses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const responses = await db
    .select({
      id: npsResponses.id,
      score: npsResponses.score,
      classification: npsResponses.classification,
      feedback: npsResponses.feedback,
      followUpAction: npsResponses.followUpAction,
      escalated: npsResponses.escalated,
      createdAt: npsResponses.createdAt,
    })
    .from(npsResponses)
    .where(eq(npsResponses.businessId, businessId))
    .orderBy(desc(npsResponses.createdAt))
    .limit(50);

  return NextResponse.json({ responses });
}
