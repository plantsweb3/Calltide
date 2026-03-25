import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordConsent } from "@/lib/compliance/consent";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const acceptSchema = z.object({
  documentTypes: z.array(z.string().min(1)).min(1).max(10),
});

/**
 * POST /api/dashboard/legal/accept
 *
 * Records re-acceptance of updated legal documents.
 * Body: { documentTypes: string[] }
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`legal-accept:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    await Promise.all(
      parsed.data.documentTypes.map((consentType) =>
        recordConsent({
          businessId,
          consentType,
          metadata: {
            method: "dashboard_reacceptance",
            acceptedAt: new Date().toISOString(),
          },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Legal re-acceptance failed", error, { extra: { businessId } });
    return NextResponse.json({ error: "Failed to record acceptance" }, { status: 500 });
  }
}
