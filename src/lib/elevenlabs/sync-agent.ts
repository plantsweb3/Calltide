import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getElevenLabsClient } from "./client";
import { buildAgentConfig } from "./agent-config";
import { getBusinessById } from "@/lib/ai/context-builder";
import { reportError, reportWarning } from "@/lib/error-reporting";

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
    const config = buildAgentConfig({
      biz,
      voiceId: record?.elevenlabsVoiceId,
    });

    let agentId = record?.elevenlabsAgentId;

    if (agentId) {
      // Update existing agent
      await client.conversationalAi.updateAgent(agentId, config);
      console.log(`[elevenlabs] updated agent ${agentId} for business ${businessId}`);
    } else {
      // Create new agent
      const result = await client.conversationalAi.createAgent(config);
      agentId = result.agent_id;

      // Store the agent ID
      await db.update(businesses).set({
        elevenlabsAgentId: agentId,
        updatedAt: new Date().toISOString(),
      }).where(eq(businesses.id, businessId));

      console.log(`[elevenlabs] created agent ${agentId} for business ${businessId}`);
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

    console.log(`[elevenlabs] deleted agent for business ${businessId}`);
  } catch (err) {
    reportError("Failed to delete ElevenLabs agent", err, { businessId });
  }
}
