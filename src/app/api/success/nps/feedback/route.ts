import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { npsResponses } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const feedbackSchema = z.object({
  businessId: z.string().min(1, "businessId is required"),
  feedback: z.string().min(1, "Feedback is required").max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { businessId, feedback } = parsed.data;

    // Find the most recent NPS response for this business within the last 24 hours
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const [recentNps] = await db
      .select({ id: npsResponses.id })
      .from(npsResponses)
      .where(
        and(
          eq(npsResponses.businessId, businessId),
          gte(npsResponses.createdAt, twentyFourHoursAgo),
        ),
      )
      .orderBy(desc(npsResponses.createdAt))
      .limit(1);

    if (!recentNps) {
      return NextResponse.json(
        { error: "No recent NPS response found" },
        { status: 404 },
      );
    }

    await db
      .update(npsResponses)
      .set({ feedback })
      .where(eq(npsResponses.id, recentNps.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("NPS feedback submission failed", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 },
    );
  }
}
