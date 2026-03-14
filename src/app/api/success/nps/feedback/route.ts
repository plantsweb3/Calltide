import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/db";
import { npsResponses } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const feedbackSchema = z.object({
  businessId: z.string().min(1, "businessId is required"),
  feedback: z.string().min(1, "Feedback is required").max(2000),
  token: z.string().min(1, "token is required"),
});

export async function POST(request: NextRequest) {
  const rl = await rateLimit(`nps-feedback:${getClientIp(request)}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { businessId, feedback, token } = parsed.data;

    // Verify HMAC token to ensure the caller owns this businessId
    const secret = process.env.CLIENT_AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const expectedToken = crypto
      .createHmac("sha256", secret)
      .update(`feedback:${businessId}`)
      .digest("hex");
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedToken);
    if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

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
