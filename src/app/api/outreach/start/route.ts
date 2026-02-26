import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startOutreachForProspect } from "@/lib/outreach/orchestrator";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const outreachSchema = z.object({
  prospectIds: z.array(z.string()).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`outreach-start:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();
  const parsed = outreachSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { prospectIds } = parsed.data;

  const results = [];
  for (const id of prospectIds) {
    const result = await startOutreachForProspect(id);
    results.push({ prospectId: id, ...result });
  }

  return NextResponse.json({ success: true, results });
}
