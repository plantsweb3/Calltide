import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pauseOutreachForProspect } from "@/lib/outreach/orchestrator";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const pauseSchema = z.object({
  prospectIds: z.array(z.string()).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`outreach-pause:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = pauseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { prospectIds } = parsed.data;

  for (const id of prospectIds) {
    await pauseOutreachForProspect(id);
  }

  return NextResponse.json({ success: true, paused: prospectIds.length });
}
