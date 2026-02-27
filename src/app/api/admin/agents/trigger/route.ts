import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/agents/trigger
 *
 * Admin-authenticated proxy for triggering agent routes.
 * Middleware handles admin auth. This route calls the agent with CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const { agentName, method, body } = (await req.json()) as {
    agentName: string;
    method?: string;
    body?: Record<string, unknown>;
  };

  if (!agentName || typeof agentName !== "string") {
    return NextResponse.json({ error: "agentName required" }, { status: 400 });
  }

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
    return NextResponse.json(
      { error: `Agent trigger failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
