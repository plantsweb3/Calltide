import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { signClientCookie } from "@/lib/client-auth";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const switchSchema = z.object({
  businessId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const currentBusinessId = req.headers.get("x-business-id");
  const accountId = req.headers.get("x-account-id");
  if (!currentBusinessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`locations-switch:${currentBusinessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = switchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const targetBusinessId = parsed.data.businessId;

  // If no accountId, can't switch locations
  if (!accountId) {
    return NextResponse.json({ error: "Multi-location not enabled" }, { status: 400 });
  }

  // IDOR prevention: verify target business belongs to the same account
  const [targetBiz] = await db
    .select({ id: businesses.id, accountId: businesses.accountId })
    .from(businesses)
    .where(and(eq(businesses.id, targetBusinessId), eq(businesses.accountId, accountId)))
    .limit(1);

  if (!targetBiz) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  // Re-sign cookie with new businessId + same accountId
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const cookieValue = await signClientCookie(targetBusinessId, secret, accountId);

  const response = NextResponse.json({ success: true, businessId: targetBusinessId });
  response.cookies.set("capta_client", cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
