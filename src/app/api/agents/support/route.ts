import { NextRequest, NextResponse } from "next/server";
import { runAgent, SUPPORT_TOOLS, AGENT_PROMPTS } from "@/lib/agents";
import { searchArticles } from "@/lib/help/search";
import { verifyCronAuth } from "@/lib/cron-auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

/**
 * POST /api/agents/support
 *
 * Trigger the Support agent to handle a client issue.
 * Called by webhooks (SMS inbound, escalation triggers) or manually from admin.
 *
 * Body: { message: string, targetId?: string, targetType?: "client" | "prospect" }
 */
export async function POST(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { message, targetId, targetType } = body as { message: unknown; targetId?: string; targetType?: "client" | "prospect" };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Search knowledge base for relevant articles before running the agent
  let kbContext = "";
  try {
    const kbResults = await searchArticles(message, { limit: 3, source: "support_agent" });
    if (kbResults.length > 0) {
      const top = kbResults[0];
      kbContext = `\n\nRELEVANT HELP ARTICLE:\nTitle: ${top.title}\nContent: ${top.content.slice(0, 1500)}\nLink: ${APP_URL}/help/${top.categorySlug}/${top.slug}\n\nUse this article to inform your response. Include the link for the client when relevant.`;
    }
  } catch {
    // KB search failure should not block the agent
  }

  const result = await runAgent({
    agentName: "support",
    systemPrompt: AGENT_PROMPTS.support,
    userMessage: message + kbContext,
    tools: SUPPORT_TOOLS,
    targetId,
    targetType,
    inputSummary: message.slice(0, 200),
  });

  return NextResponse.json(result);
}
