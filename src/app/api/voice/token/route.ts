import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/voice/token
 *
 * Returns an ElevenLabs signed URL for the business's agent.
 * Used by dashboard features that need voice access.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`voice-token:${ip}`, RATE_LIMITS.auth);
  if (!rl.success) return rateLimitResponse(rl);

  // Require a valid dashboard or admin session (middleware now verifies signatures)
  const businessId = req.headers.get("x-business-id");
  const hasAdminCookie = req.cookies.has("capta_admin");
  if (!businessId && !hasAdminCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voice system not configured" }, { status: 500 });
  }

  // Get the agent ID for this business
  let agentId: string | null = null;
  if (businessId) {
    const [biz] = await db
      .select({ elevenlabsAgentId: businesses.elevenlabsAgentId })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    agentId = biz?.elevenlabsAgentId ?? null;
  }

  if (!agentId) {
    // Fall back to demo agent if no business-specific agent
    agentId = process.env.ELEVENLABS_DEMO_AGENT_ID ?? null;
  }

  if (!agentId) {
    return NextResponse.json({ error: "No agent configured" }, { status: 500 });
  }

  try {
    const client = getElevenLabsClient();
    const response = await client.conversationalAi.getSignedUrl({
      agent_id: agentId,
    });

    return NextResponse.json({ signedUrl: response.signed_url });
  } catch {
    return NextResponse.json({ error: "Failed to get voice access" }, { status: 500 });
  }
}
