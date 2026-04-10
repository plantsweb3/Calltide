/**
 * One-off heal script: provision missing ElevenLabs agent + voice + activate
 * for a single business.
 *
 * Usage: npx tsx scripts/heal-business.ts <business_id>
 *
 * This is needed for businesses that signed up before the agent_sync retry
 * handler existed (added April 10, 2026) — their fire-and-forget syncAgent
 * call may have failed silently leaving them with no agent.
 */

import "dotenv/config";

async function main() {
  const businessId = process.argv[2];
  if (!businessId) {
    console.error("Usage: npx tsx scripts/heal-business.ts <business_id>");
    process.exit(1);
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY is required");
    process.exit(1);
  }

  const { db } = await import("../src/db");
  const { businesses } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const { syncAgent } = await import("../src/lib/elevenlabs/sync-agent");
  const { VOICE_MAP } = await import("../src/lib/elevenlabs/agent-config");

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    console.error(`Business ${businessId} not found.`);
    process.exit(1);
  }

  console.log(`Found: ${biz.name}`);
  console.log(`  Owner: ${biz.ownerName} <${biz.ownerEmail}>`);
  console.log(`  Twilio: ${biz.twilioNumber}`);
  console.log(`  Active: ${biz.active}`);
  console.log(`  Personality: ${biz.personalityPreset}`);
  console.log(`  Current agent ID: ${biz.elevenlabsAgentId || "(none)"}`);
  console.log(`  Current voice ID: ${biz.elevenlabsVoiceId || "(none)"}`);

  // Set default voice based on personality if missing
  if (!biz.elevenlabsVoiceId) {
    const presetKey = biz.personalityPreset || "friendly";
    const defaultVoice = VOICE_MAP[presetKey] || VOICE_MAP.friendly;
    console.log(`\nSetting default voice for "${presetKey}": ${defaultVoice}`);
    await db
      .update(businesses)
      .set({ elevenlabsVoiceId: defaultVoice, updatedAt: new Date().toISOString() })
      .where(eq(businesses.id, businessId));
  }

  console.log("\nRunning syncAgent...");
  const agentId = await syncAgent(businessId);
  if (!agentId) {
    console.error("✗ syncAgent returned null. Check logs for the error.");
    process.exit(1);
  }
  console.log(`✓ Agent ID: ${agentId}`);

  // Activate the business now that everything's wired
  if (!biz.active) {
    console.log("\nActivating business...");
    await db
      .update(businesses)
      .set({ active: true, updatedAt: new Date().toISOString() })
      .where(eq(businesses.id, businessId));
    console.log("✓ Activated");
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Heal failed:", err);
  process.exit(1);
});
