/**
 * One-time migration script: create ElevenLabs agents for all active businesses.
 * Run: npx tsx scripts/migrate-to-elevenlabs.ts
 *
 * This iterates all active businesses that don't have an ElevenLabs agent ID
 * and creates agents for them via the syncAgent function.
 */

import "dotenv/config";

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY is required");
    process.exit(1);
  }

  const { db } = await import("../src/db");
  const { businesses } = await import("../src/db/schema");
  const { eq, and, isNull } = await import("drizzle-orm");
  const { syncAgent } = await import("../src/lib/elevenlabs/sync-agent");

  // Find all active businesses without an ElevenLabs agent
  const bizList = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .where(
      and(
        eq(businesses.active, true),
        isNull(businesses.elevenlabsAgentId),
      ),
    );

  console.log(`Found ${bizList.length} businesses to migrate.`);

  let success = 0;
  let failed = 0;

  for (const biz of bizList) {
    console.log(`Migrating: ${biz.name} (${biz.id})`);
    try {
      const agentId = await syncAgent(biz.id);
      if (agentId) {
        console.log(`  ✓ Agent created: ${agentId}`);
        success++;
      } else {
        console.log(`  ✗ Agent creation returned null`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✗ Failed:`, err);
      failed++;
    }

    // Rate limit: 1 agent per second to avoid API throttling
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nMigration complete: ${success} succeeded, ${failed} failed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
