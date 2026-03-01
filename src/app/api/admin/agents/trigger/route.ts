import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reportError } from "@/lib/error-reporting";

const triggerSchema = z.object({
  agentName: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/admin/agents/trigger
 *
 * Admin-authenticated proxy for triggering agent routes.
 * Middleware handles admin auth. This route calls the agent with CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = triggerSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { agentName, method, body } = parsed.data;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  // Build the internal URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const url = `${appUrl}/api/agents/${agentName}`;
  const httpMethod = method || "GET";

  try {
    const res = await fetch(url, {
      method: httpMethod,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
      ...(httpMethod !== "GET" && body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    reportError("[agent trigger] Agent trigger failed", err, { extra: { agentName } });
    return NextResponse.json(
      { error: "Agent trigger failed" },
      { status: 500 },
    );
  }
}
