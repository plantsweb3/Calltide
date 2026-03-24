import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validatePortalToken } from "@/lib/portal/auth";
import { rateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

const bodySchema = z.object({
  token: z.string().min(1).max(100),
});

/**
 * POST /api/portal/auth
 * Validate a portal token and return customer + business data.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`portal-auth:${ip}`, RATE_LIMITS.auth);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await validatePortalToken(parsed.data.token);
    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired portal link" },
        { status: 401 }
      );
    }

    const { customer, business } = result;

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        language: customer.language,
      },
      business: {
        id: business.id,
        name: business.name,
        type: business.type,
        ownerPhone: business.ownerPhone,
        twilioNumber: business.twilioNumber,
      },
    });
  } catch (err) {
    reportError("Portal auth failed", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
