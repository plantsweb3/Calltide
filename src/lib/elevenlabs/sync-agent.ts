import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getElevenLabsClient } from "./client";
import { buildAgentConfig } from "./agent-config";
import { getBusinessById } from "@/lib/ai/context-builder";
import { reportError, reportWarning } from "@/lib/error-reporting";

function isTransientError(err: unknown): boolean {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const status = e?.status ?? e?.statusCode;
  if (status === 429) return true;
  if (status && status >= 500 && status < 600) return true;
  const msg = String(e?.message ?? "");
  return /rate[-\s]?limit|timeout|ECONNRESET|ETIMEDOUT/i.test(msg);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err) || i === attempts - 1) throw err;
      const delay = 300 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/**
 * Sync a business's ElevenLabs agent.
 * Creates a new agent if none exists, or updates the existing one.
 * Called from: setup completion, settings PUT, admin business edit.
 */
export async function syncAgent(businessId: string): Promise<string | null> {
  if (!process.env.ELEVENLABS_API_KEY) {
    reportWarning("ELEVENLABS_API_KEY not set — skipping agent sync", { businessId });
    return null;
  }

  try {
    const biz = await getBusinessById(businessId);
    if (!biz) {
      reportWarning("syncAgent: business not found", { businessId });
      return null;
    }

    // Get current agent ID and voice from DB
    const [record] = await db
      .select({
        elevenlabsAgentId: businesses.elevenlabsAgentId,
        elevenlabsVoiceId: businesses.elevenlabsVoiceId,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const client = getElevenLabsClient();

    // Tools are embedded inline in the agent config
    const config = await buildAgentConfig({
      biz,
      voiceId: record?.elevenlabsVoiceId,
    });

    let agentId = record?.elevenlabsAgentId;

    if (agentId) {
      // Update existing agent (retry transient 429/5xx)
      await withRetry(() => client.conversationalAi.updateAgent(agentId!, config));
      reportWarning(`[elevenlabs] updated agent ${agentId} for business ${businessId}`);
    } else {
      // Create new agent (retry transient 429/5xx)
      const result = await withRetry(() => client.conversationalAi.createAgent(config));
      agentId = result.agent_id;

      // Store the agent ID
      await db.update(businesses).set({
        elevenlabsAgentId: agentId,
        updatedAt: new Date().toISOString(),
      }).where(eq(businesses.id, businessId));

      reportWarning(`[elevenlabs] created agent ${agentId} for business ${businessId}`);
    }

    return agentId;
  } catch (err) {
    reportError("Failed to sync ElevenLabs agent", err, { businessId });
    return null;
  }
}

/**
 * Delete a business's ElevenLabs agent.
 */
export async function deleteAgent(businessId: string): Promise<void> {
  if (!process.env.ELEVENLABS_API_KEY) return;

  try {
    const [record] = await db
      .select({ elevenlabsAgentId: businesses.elevenlabsAgentId })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!record?.elevenlabsAgentId) return;

    const client = getElevenLabsClient();
    await client.conversationalAi.deleteAgent(record.elevenlabsAgentId);

    await db.update(businesses).set({
      elevenlabsAgentId: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(businesses.id, businessId));

    reportWarning(`[elevenlabs] deleted agent for business ${businessId}`);
  } catch (err) {
    reportError("Failed to delete ElevenLabs agent", err, { businessId });
  }
}
