import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scheduleAuditCall } from "@/lib/outreach/audit";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const scheduleSchema = z.object({
  prospectIds: z.array(z.string()).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`audit-schedule:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { prospectIds } = parsed.data;

  const results = [];
  for (const id of prospectIds) {
    const result = await scheduleAuditCall(id);
    results.push({ prospectId: id, ...result });
  }

  const scheduled = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: true,
    scheduled,
    failed,
    results,
  });
}
