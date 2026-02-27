import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { callQaScores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const scores = await db
    .select({
      id: callQaScores.id,
      callId: callQaScores.callId,
      score: callQaScores.score,
      breakdown: callQaScores.breakdown,
      flags: callQaScores.flags,
      fixRecommendation: callQaScores.fixRecommendation,
      summary: callQaScores.summary,
      isFirstWeek: callQaScores.isFirstWeek,
      createdAt: callQaScores.createdAt,
    })
    .from(callQaScores)
    .where(eq(callQaScores.businessId, businessId))
    .orderBy(desc(callQaScores.createdAt))
    .limit(100);

  return NextResponse.json({ scores });
}
