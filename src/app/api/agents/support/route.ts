import { NextRequest, NextResponse } from "next/server";
import { runAgent, SUPPORT_TOOLS, AGENT_PROMPTS } from "@/lib/agents";

/**
 * POST /api/agents/support
 *
 * Trigger the Support agent to handle a client issue.
 * Called by webhooks (SMS inbound, escalation triggers) or manually from admin.
 *
 * Body: { message: string, targetId?: string, targetType?: "client" | "prospect" }
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message, targetId, targetType } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const result = await runAgent({
    agentName: "support",
    systemPrompt: AGENT_PROMPTS.support,
    userMessage: message,
    tools: SUPPORT_TOOLS,
    targetId,
    targetType,
    inputSummary: message.slice(0, 200),
  });

  return NextResponse.json(result);
}
