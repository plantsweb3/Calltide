import "dotenv/config";
import { db } from "../src/db";
import { agentConfig } from "../src/db/schema";

const agents = [
  { agentName: "support", enabled: true, cronExpression: null, escalationThreshold: 3 },
  { agentName: "qualify", enabled: true, cronExpression: null, escalationThreshold: 2 },
  { agentName: "churn", enabled: true, cronExpression: "0 14 * * *", escalationThreshold: 3 },
  { agentName: "onboard", enabled: true, cronExpression: "0 * * * *", escalationThreshold: 3 },
  { agentName: "health", enabled: true, cronExpression: "*/5 * * * *", escalationThreshold: 1 },
];

async function seed() {
  console.log("Seeding agent configs...");

  for (const agent of agents) {
    await db
      .insert(agentConfig)
      .values(agent)
      .onConflictDoNothing({ target: agentConfig.agentName });
    console.log(`  ✓ ${agent.agentName}`);
  }

  console.log("Done.");
}

seed().catch(console.error);
