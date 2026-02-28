import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initiateOutboundCall, scheduleOutboundCall } from "@/lib/outbound/engine";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const scheduleSchema = z.object({
  businessId: z.string().min(1),
  customerId: z.string().optional(),
  customerPhone: z.string().min(10),
  callType: z.enum(["appointment_reminder", "estimate_followup", "seasonal_reminder"]),
  referenceId: z.string().optional(),
  scheduledFor: z.string().min(1),
  language: z.string().optional(),
});

const initiateSchema = z.object({
  outboundCallId: z.string().min(1),
});

/**
 * POST /api/outbound/call
 * Two modes:
 * - { action: "schedule", ...scheduleParams } — schedule a new outbound call
 * - { action: "initiate", outboundCallId } — initiate an already-scheduled call
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`outbound-call:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  // Auth: require cron secret or admin cookie
  const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  const hasAdminCookie = req.cookies.has("calltide_admin");
  const hasClientCookie = req.cookies.has("calltide_client");

  if (cronSecret !== process.env.CRON_SECRET && !hasAdminCookie && !hasClientCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "initiate") {
      const parsed = initiateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, { status: 400 });
      }
      const result = await initiateOutboundCall(parsed.data.outboundCallId);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    // Default: schedule
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await scheduleOutboundCall(parsed.data);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    reportError("Outbound call API error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
