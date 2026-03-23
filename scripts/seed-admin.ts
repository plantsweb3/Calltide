import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  businesses,
  calls,
  customerNotes,
  systemHealthLogs,
  revenueMetrics,
  churnRiskScores,
  escalations,
} from "../src/db/schema";
import "dotenv/config";

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const db = drizzle(client);

  // Fetch existing businesses and calls
  const allBusinesses = await db.select().from(businesses);
  const allCalls = await db.select().from(calls);

  if (allBusinesses.length === 0) {
    console.log("No businesses found. Run db:seed first.");
    process.exit(1);
  }

  console.log(`Found ${allBusinesses.length} businesses, ${allCalls.length} calls`);

  // ── 1. Revenue Metrics (60 days) ──
  console.log("Seeding revenue metrics...");
  const now = new Date();
  for (let i = 59; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const baseMrr = 4500 + Math.floor(i * 30) + Math.floor(Math.random() * 200);
    const customerCount = allBusinesses.length + Math.floor(Math.random() * 3);

    await db.insert(revenueMetrics).values({
      date: dateStr,
      mrr: baseMrr,
      arr: baseMrr * 12,
      customerCount,
      newCustomers: Math.random() > 0.7 ? 1 : 0,
      churnedCustomers: Math.random() > 0.9 ? 1 : 0,
      failedPayments: Math.random() > 0.85 ? 1 : 0,
    });
  }
  console.log("  → 60 days of revenue metrics inserted");

  // ── 2. System Health Logs (6 services × 24 entries) ──
  console.log("Seeding system health logs...");
  const services = ["ElevenLabs Voice AI", "Twilio Voice", "Twilio SMS", "Turso DB", "Anthropic API", "Resend Email"];

  for (const service of services) {
    for (let h = 23; h >= 0; h--) {
      const checkedAt = new Date(now);
      checkedAt.setHours(checkedAt.getHours() - h);
      const isDown = Math.random() > 0.97;
      const isDegraded = !isDown && Math.random() > 0.9;

      await db.insert(systemHealthLogs).values({
        serviceName: service,
        status: isDown ? "down" : isDegraded ? "degraded" : "operational",
        latencyMs: isDown ? null : Math.floor(50 + Math.random() * (isDegraded ? 500 : 150)),
        errorCount: isDown ? Math.floor(5 + Math.random() * 20) : isDegraded ? Math.floor(1 + Math.random() * 5) : 0,
        uptimePct: isDown ? 85 + Math.random() * 10 : isDegraded ? 95 + Math.random() * 4 : 99.5 + Math.random() * 0.5,
        checkedAt: checkedAt.toISOString().replace("T", " ").slice(0, 19),
      });
    }
  }
  console.log("  → 144 health log entries inserted");

  // ── 3. Churn Risk Scores (per business) ──
  console.log("Seeding churn risk scores...");
  const riskFactors = [
    "Low call volume",
    "Declining appointment rate",
    "No calls in 14 days",
    "High missed call rate",
    "Payment failed recently",
    "Reduced engagement",
    "Competitor inquiry detected",
    "Owner complaint",
  ];

  for (const biz of allBusinesses) {
    const score = Math.floor(Math.random() * 10) + 1;
    const numFactors = Math.min(score > 5 ? 3 : score > 3 ? 2 : 1, riskFactors.length);
    const shuffled = [...riskFactors].sort(() => Math.random() - 0.5);
    const factors = shuffled.slice(0, numFactors);

    await db.insert(churnRiskScores).values({
      customerId: biz.id,
      score,
      factors,
    });
  }
  console.log(`  → ${allBusinesses.length} churn risk scores inserted`);

  // ── 4. Customer Notes ──
  console.log("Seeding customer notes...");
  const noteTemplates = [
    "Initial onboarding call completed. Client is excited about the AI receptionist.",
    "Configured bilingual support (EN/ES). Owner prefers Spanish-first greeting.",
    "Client requested custom greeting for after-hours calls.",
    "Follow-up: Client reports increased appointment bookings since launch.",
    "Reviewed call transcripts — AI handling complex scheduling well.",
    "Owner wants to add a second Twilio number for HVAC-specific calls.",
    "Monthly review: 94% call completion rate, client very satisfied.",
    "Client reported one missed call due to Twilio outage. Credited account.",
  ];

  for (const biz of allBusinesses) {
    const numNotes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numNotes; i++) {
      const note = noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
      await db.insert(customerNotes).values({
        customerId: biz.id,
        noteText: note,
        createdBy: "admin",
      });
    }
  }
  console.log(`  → Customer notes inserted`);

  // ── 5. Escalations (linked to calls) ──
  console.log("Seeding escalations...");
  const escalationReasons = [
    "Caller requested human transfer",
    "AI unable to understand language",
    "Emergency service request",
    "Billing dispute",
    "Repeat caller with unresolved issue",
    "Negative sentiment detected",
    "Complex scheduling conflict",
  ];
  const statuses: Array<"open" | "in_progress" | "resolved"> = ["open", "in_progress", "resolved"];

  const callsToEscalate = allCalls.slice(0, Math.min(15, allCalls.length));
  for (const call of callsToEscalate) {
    const reason = escalationReasons[Math.floor(Math.random() * escalationReasons.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    await db.insert(escalations).values({
      callId: call.id,
      customerId: call.businessId,
      reason,
      resolutionStatus: status,
      assignedTo: Math.random() > 0.3 ? "admin" : null,
      notes: status === "resolved" ? "Issue resolved after follow-up with client." : null,
      resolvedAt: status === "resolved" ? new Date().toISOString().replace("T", " ").slice(0, 19) : null,
    });
  }
  console.log(`  → ${callsToEscalate.length} escalations inserted`);

  console.log("\nAdmin seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
