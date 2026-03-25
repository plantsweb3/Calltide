import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobCards, ownerResponses, customerNotifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`job-cards-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  try {
    const [card] = await db
      .select()
      .from(jobCards)
      .where(and(eq(jobCards.id, id), eq(jobCards.businessId, businessId)))
      .limit(1);

    if (!card) {
      return NextResponse.json({ error: "Job card not found" }, { status: 404 });
    }

    const [responses, notifications] = await Promise.all([
      db
        .select()
        .from(ownerResponses)
        .where(eq(ownerResponses.jobCardId, id))
        .orderBy(desc(ownerResponses.createdAt)),
      db
        .select()
        .from(customerNotifications)
        .where(eq(customerNotifications.jobCardId, id))
        .orderBy(desc(customerNotifications.sentAt)),
    ]);

    return NextResponse.json({
      card,
      responses,
      notifications,
    });
  } catch (error) {
    reportError("Failed to fetch job card detail", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch job card" }, { status: 500 });
  }
}
