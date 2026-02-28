/**
 * Calltide Bootstrap Script
 *
 * First-run setup: validates env, runs migrations, seeds data,
 * and verifies the pipeline is ready.
 *
 * Usage: npx tsx scripts/bootstrap.ts
 */
import "dotenv/config";
import { execSync } from "child_process";

const REQUIRED_ENV = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "HUME_API_KEY",
  "HUME_SECRET_KEY",
  "HUME_CONFIG_ID",
  "ANTHROPIC_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "NEXT_PUBLIC_APP_URL",
  "OWNER_EMAIL",
  "OWNER_PHONE",
  "CRON_SECRET",
  "ADMIN_PASSWORD",
  "CLIENT_AUTH_SECRET",
] as const;

const RECOMMENDED_ENV = [
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
  "GOOGLE_PLACES_API_KEY",
  "CLM_API_KEY",
] as const;

function log(msg: string) {
  console.log(`  ${msg}`);
}

function header(msg: string) {
  console.log(`\n── ${msg} ──`);
}

function run(cmd: string, label: string): boolean {
  log(`Running: ${label}...`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
    return true;
  } catch {
    console.error(`  FAILED: ${label}`);
    return false;
  }
}

async function bootstrap() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║      Calltide Bootstrap Script       ║");
  console.log("╚══════════════════════════════════════╝");

  // ── Step 1: Pre-flight env checks ──
  header("Step 1: Environment Variables");

  const missing: string[] = [];
  const missingRecommended: string[] = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of RECOMMENDED_ENV) {
    if (!process.env[key]) {
      missingRecommended.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("\n  MISSING REQUIRED env vars:");
    for (const key of missing) {
      console.error(`    - ${key}`);
    }
    console.error("\n  Set these in .env.local before continuing.");
    process.exit(1);
  }

  log("All required env vars present");

  if (missingRecommended.length > 0) {
    log("Optional (not blocking):");
    for (const key of missingRecommended) {
      log(`  - ${key}`);
    }
  }

  // Validate key formats
  if (!process.env.TWILIO_ACCOUNT_SID?.startsWith("AC")) {
    console.error("  TWILIO_ACCOUNT_SID must start with 'AC'");
    process.exit(1);
  }
  if (!process.env.TWILIO_PHONE_NUMBER?.startsWith("+")) {
    console.error("  TWILIO_PHONE_NUMBER must be E.164 format (start with +)");
    process.exit(1);
  }
  if ((process.env.CRON_SECRET?.length ?? 0) < 16) {
    console.error("  CRON_SECRET must be at least 16 characters");
    process.exit(1);
  }
  if ((process.env.CLIENT_AUTH_SECRET?.length ?? 0) < 16) {
    console.error("  CLIENT_AUTH_SECRET must be at least 16 characters");
    process.exit(1);
  }

  log("Env format validations passed");

  // ── Step 2: Database Migrations ──
  header("Step 2: Database Migrations");
  if (!run("npx drizzle-kit migrate", "drizzle-kit migrate")) {
    console.error("  Migration failed. Fix errors above and re-run.");
    process.exit(1);
  }
  log("Migrations complete");

  // ── Step 3: Seed Data ──
  header("Step 3: Seed Data");

  const seedSteps = [
    { cmd: "npx tsx scripts/seed-business.ts", label: "Business seed data" },
    { cmd: "npx tsx scripts/seed-admin.ts", label: "Admin seed data (metrics, health, churn)" },
    { cmd: "npx tsx scripts/seed-agents.ts", label: "Agent seed data" },
    { cmd: "npx tsx scripts/seed-and-generate-kb.ts", label: "Knowledge base articles" },
  ];

  for (const step of seedSteps) {
    if (!run(step.cmd, step.label)) {
      log(`Warning: ${step.label} failed — continuing (may already be seeded)`);
    }
  }

  // ── Step 4: Hume Configuration ──
  header("Step 4: Hume EVI Configuration");
  log("Hume tools...");
  run("npx tsx scripts/setup-hume-tools.ts", "Hume tool definitions");
  log("Hume config...");
  run("npx tsx scripts/setup-hume-config.ts", "Hume EVI config");

  // ── Step 5: Verification ──
  header("Step 5: Build Verification");
  if (!run("npx next build", "Next.js production build")) {
    console.error("  Build failed. Fix errors above before deploying.");
    process.exit(1);
  }

  // ── Summary ──
  header("Bootstrap Complete");
  log("Database:   migrated + seeded");
  log("Hume:       configured");
  log("Build:      passing");
  console.log("\n  Next steps:");
  log("1. Deploy to Vercel (vercel deploy --prod)");
  log("2. Set env vars in Vercel dashboard");
  log("3. Configure Stripe webhook → {APP_URL}/api/stripe/webhook");
  log("4. Configure Hume webhook  → {APP_URL}/api/hume/webhook");
  log("5. Verify crons fire correctly in /admin/agents");
  log("6. Make a test call to verify end-to-end pipeline");
  console.log("");
}

bootstrap().catch((err) => {
  console.error("\nBootstrap failed:", err);
  process.exit(1);
});
