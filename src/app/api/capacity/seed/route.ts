import { NextResponse } from "next/server";
import { db } from "@/db";
import { scalingPlaybook } from "@/db/schema";
import { reportError } from "@/lib/error-reporting";

const playbook = [
  // SEED TIER
  { tier: "seed", clientRange: "1-50", provider: "hume", action: "Use Pro plan (10 concurrent, 1,200 min)", planRequired: "Pro", estimatedMonthlyCost: "$70", priority: "required" },
  { tier: "seed", clientRange: "1-50", provider: "anthropic", action: "Tier 2 deposit ($40). Use Haiku for calls.", planRequired: "Tier 2", estimatedMonthlyCost: "$20", priority: "required" },
  { tier: "seed", clientRange: "1-50", provider: "turso", action: "Developer plan", planRequired: "Developer", estimatedMonthlyCost: "$5", priority: "required" },
  { tier: "seed", clientRange: "1-50", provider: "vercel", action: "Enable Fluid Compute", planRequired: "Hobby/Pro", estimatedMonthlyCost: "$0-20", priority: "required" },

  // GROWTH TIER
  { tier: "growth", clientRange: "50-200", provider: "hume", action: "Upgrade to Scale plan (15 concurrent). Request limit increase if needed.", planRequired: "Scale", estimatedMonthlyCost: "$200-500", priority: "required" },
  { tier: "growth", clientRange: "50-200", provider: "twilio", action: "Register A2P 10DLC campaign for SMS compliance", planRequired: "N/A", estimatedMonthlyCost: "$15 registration", priority: "required" },
  { tier: "growth", clientRange: "50-200", provider: "anthropic", action: "Tier 3 deposit ($200). Enable prompt caching.", planRequired: "Tier 3", estimatedMonthlyCost: "$80", priority: "required" },
  { tier: "growth", clientRange: "50-200", provider: "turso", action: "Add indexes on all high-frequency query columns", planRequired: "Developer", estimatedMonthlyCost: "$5", priority: "required" },
  { tier: "growth", clientRange: "50-200", provider: "vercel", action: "Upgrade to Pro plan if not already", planRequired: "Pro", estimatedMonthlyCost: "$20", priority: "recommended" },

  // SCALE TIER
  { tier: "scale", clientRange: "200-500", provider: "hume", action: "Upgrade to Business plan (30 concurrent). Negotiate volume pricing.", planRequired: "Business", estimatedMonthlyCost: "$500-2,000", priority: "required" },
  { tier: "scale", clientRange: "200-500", provider: "anthropic", action: "Tier 4 deposit ($400). Aggressive prompt caching.", planRequired: "Tier 4", estimatedMonthlyCost: "$200", priority: "required" },
  { tier: "scale", clientRange: "200-500", provider: "turso", action: "Upgrade to Scaler plan ($29/mo). Enable overages.", planRequired: "Scaler", estimatedMonthlyCost: "$29", priority: "required" },
  { tier: "scale", clientRange: "200-500", provider: "twilio", action: "Consider regional phone numbers for Texas markets", planRequired: "N/A", estimatedMonthlyCost: "$50/number", priority: "recommended" },

  // ENTERPRISE TIER
  { tier: "enterprise", clientRange: "500-1,000", provider: "hume", action: "Negotiate Enterprise plan. 100+ concurrent. SLA guarantees. Volume pricing.", planRequired: "Enterprise", estimatedMonthlyCost: "$3,000-5,000", priority: "required" },
  { tier: "enterprise", clientRange: "500-1,000", provider: "anthropic", action: "Contact Anthropic for custom rate limits. Consider Priority Tier.", planRequired: "Custom", estimatedMonthlyCost: "$450", priority: "required" },
  { tier: "enterprise", clientRange: "500-1,000", provider: "twilio", action: "Establish Twilio account manager relationship. Toll-free backup number.", planRequired: "N/A", estimatedMonthlyCost: "$850", priority: "recommended" },
  { tier: "enterprise", clientRange: "500-1,000", provider: "turso", action: "Add Turso read replica in secondary region", planRequired: "Scaler", estimatedMonthlyCost: "$29", priority: "recommended" },

  // HYPERGROWTH TIER
  { tier: "hypergrowth", clientRange: "1,000-2,000", provider: "hume", action: "Enterprise with 200+ concurrent. Dedicated infrastructure. Redundancy config.", planRequired: "Enterprise+", estimatedMonthlyCost: "$8,000-10,000+", priority: "required" },
  { tier: "hypergrowth", clientRange: "1,000-2,000", provider: "anthropic", action: "Priority Tier commitment. Model fallback: Sonnet→Haiku if rate limited.", planRequired: "Custom", estimatedMonthlyCost: "$900", priority: "required" },
  { tier: "hypergrowth", clientRange: "1,000-2,000", provider: "vercel", action: "Evaluate Enterprise plan or migrate webhooks to dedicated server", planRequired: "Enterprise", estimatedMonthlyCost: "$50+", priority: "recommended" },
  { tier: "hypergrowth", clientRange: "1,000-2,000", provider: "turso", action: "Upgrade to Pro plan ($99). Consider multi-database architecture.", planRequired: "Pro", estimatedMonthlyCost: "$99", priority: "recommended" },
  { tier: "hypergrowth", clientRange: "1,000-2,000", provider: "twilio", action: "Multiple geographic phone numbers. Enterprise agreement. Load test.", planRequired: "Enterprise", estimatedMonthlyCost: "$1,700", priority: "required" },
];

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clear existing playbook entries
    await db.delete(scalingPlaybook);

    // Insert all entries
    for (const entry of playbook) {
      await db.insert(scalingPlaybook).values(entry);
    }

    return NextResponse.json({ ok: true, count: playbook.length });
  } catch (err) {
    reportError("[capacity seed] Error", err);
    return NextResponse.json(
      { error: "Seed failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
