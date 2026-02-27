/**
 * Calltide Bootstrap Script
 *
 * Seeds initial data for a fresh deployment.
 * Run with: npx tsx src/scripts/bootstrap.ts
 */

import { db } from "../db";
import {
  scalingPlaybook,
  helpCategories,
  helpArticles,
  legalDocuments,
  subProcessors,
} from "../db/schema";
import { sql } from "drizzle-orm";

async function bootstrap() {
  console.log("Calltide Bootstrap\n");

  // ── 1. Seed scaling playbook ──
  console.log("Seeding scaling playbook...");
  const [existingPlaybook] = await db
    .select({ count: sql<number>`count(*)` })
    .from(scalingPlaybook);

  if ((existingPlaybook?.count ?? 0) === 0) {
    const tiers = [
      { tier: "seed", clientRange: "1-10", entries: [
        { provider: "Twilio", action: "Standard plan, 1 phone number", planRequired: "Pay-as-you-go", estimatedMonthlyCost: "$50-200" },
        { provider: "Hume", action: "Starter plan, standard EVI config", planRequired: "Starter", estimatedMonthlyCost: "$100-300" },
        { provider: "Anthropic", action: "Standard API access", planRequired: "Standard", estimatedMonthlyCost: "$50-150" },
        { provider: "Turso", action: "Free/Starter plan", planRequired: "Starter", estimatedMonthlyCost: "$0-29" },
        { provider: "Resend", action: "Free tier (100 emails/day)", planRequired: "Free", estimatedMonthlyCost: "$0" },
      ]},
      { tier: "growth", clientRange: "11-50", entries: [
        { provider: "Twilio", action: "Upgrade to Business, add redundant numbers", planRequired: "Business", estimatedMonthlyCost: "$500-1500" },
        { provider: "Hume", action: "Growth plan, custom voice config per client", planRequired: "Growth", estimatedMonthlyCost: "$500-1000" },
        { provider: "Anthropic", action: "Scale tier, monitor token usage", planRequired: "Scale", estimatedMonthlyCost: "$300-800" },
        { provider: "Turso", action: "Pro plan, enable read replicas", planRequired: "Pro", estimatedMonthlyCost: "$29-99" },
        { provider: "Resend", action: "Pro plan (50K emails/month)", planRequired: "Pro", estimatedMonthlyCost: "$20-50" },
      ]},
      { tier: "scale", clientRange: "51-200", entries: [
        { provider: "Twilio", action: "Enterprise plan, dedicated numbers, CNAM", planRequired: "Enterprise", estimatedMonthlyCost: "$3000-8000" },
        { provider: "Hume", action: "Enterprise plan, priority support", planRequired: "Enterprise", estimatedMonthlyCost: "$2000-5000" },
        { provider: "Anthropic", action: "Enterprise tier, prompt caching", planRequired: "Enterprise", estimatedMonthlyCost: "$1500-4000" },
        { provider: "Turso", action: "Enterprise, multi-region", planRequired: "Enterprise", estimatedMonthlyCost: "$100-500" },
        { provider: "Resend", action: "Business plan (200K emails/month)", planRequired: "Business", estimatedMonthlyCost: "$50-200" },
      ]},
    ];

    for (const t of tiers) {
      for (const e of t.entries) {
        await db.insert(scalingPlaybook).values({
          tier: t.tier,
          clientRange: t.clientRange,
          provider: e.provider,
          action: e.action,
          planRequired: e.planRequired,
          estimatedMonthlyCost: e.estimatedMonthlyCost,
          priority: "required",
        });
      }
    }
    console.log("  Seeded 15 scaling playbook entries");
  } else {
    console.log("  Scaling playbook already has data, skipping");
  }

  // ── 2. Check help center ──
  console.log("Checking help center...");
  const [categoryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(helpCategories);
  const [articleCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(helpArticles);
  console.log(`  ${categoryCount?.count ?? 0} categories, ${articleCount?.count ?? 0} articles`);

  // ── 3. Seed legal documents (if empty) ──
  console.log("Checking legal documents...");
  const [legalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(legalDocuments);

  if ((legalCount?.count ?? 0) === 0) {
    const docs = [
      { documentType: "tos", version: "1.0", title: "Terms of Service", titleEs: "Términos de Servicio" },
      { documentType: "privacy_policy", version: "1.0", title: "Privacy Policy", titleEs: "Política de Privacidad" },
      { documentType: "dpa", version: "1.0", title: "Data Processing Agreement", titleEs: "Acuerdo de Procesamiento de Datos" },
    ];
    for (const doc of docs) {
      await db.insert(legalDocuments).values({
        ...doc,
        effectiveDate: new Date().toISOString().slice(0, 10),
        content: `# ${doc.title}\n\nPlaceholder — replace with final legal content.`,
        contentEs: `# ${doc.titleEs}\n\nMarcador de posición — reemplace con contenido legal final.`,
      });
    }
    console.log("  Seeded 3 legal document placeholders");
  } else {
    console.log(`  ${legalCount?.count ?? 0} legal documents exist, skipping`);
  }

  // ── 4. Seed sub-processors (if empty) ──
  console.log("Checking sub-processors...");
  const [spCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subProcessors);

  if ((spCount?.count ?? 0) === 0) {
    const processors = [
      { name: "Twilio", purpose: "Voice calling, SMS messaging", dataProcessed: ["Phone numbers", "Call recordings", "SMS content"], location: "United States" },
      { name: "Hume AI", purpose: "Voice AI / EVI (Empathic Voice Interface)", dataProcessed: ["Voice audio", "Conversation data"], location: "United States" },
      { name: "Anthropic", purpose: "LLM (Claude) for AI agent reasoning", dataProcessed: ["Conversation context", "Business data summaries"], location: "United States" },
      { name: "Turso (libSQL)", purpose: "Primary database", dataProcessed: ["All application data"], location: "United States" },
      { name: "Vercel", purpose: "Application hosting, edge compute", dataProcessed: ["Request logs", "Application code"], location: "United States" },
      { name: "Resend", purpose: "Transactional and marketing email", dataProcessed: ["Email addresses", "Email content"], location: "United States" },
    ];
    for (const p of processors) {
      await db.insert(subProcessors).values(p);
    }
    console.log("  Seeded 6 sub-processors");
  } else {
    console.log(`  ${spCount?.count ?? 0} sub-processors exist, skipping`);
  }

  console.log("\nBootstrap complete.");
  console.log("Next steps:");
  console.log("  1. Verify Anthropic API key is valid");
  console.log("  2. Configure Stripe webhook -> /api/stripe/webhook");
  console.log("  3. Run each agent manually from /admin/agents");
  console.log("  4. Make a test call to verify full pipeline");
}

bootstrap().catch(console.error);
