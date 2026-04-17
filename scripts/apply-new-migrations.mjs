#!/usr/bin/env node
/**
 * One-off: apply the two new migrations (0082, 0083) against Turso.
 *
 * drizzle-kit's migration journal is out of sync with prod (past migrations
 * were applied via a separate path), so `drizzle-kit migrate` re-runs old
 * files and errors on duplicate-column. This script applies only the new SQL
 * and is idempotent — safe to re-run.
 */
import { createClient } from "@libsql/client";
import fs from "node:fs/promises";
import path from "node:path";

const MIGRATIONS = [
  "src/db/migrations/0082_voice_tool_idempotency.sql",
  "src/db/migrations/0083_stripe_event_status.sql",
];

async function columnExists(client, table, col) {
  const r = await client.execute(`PRAGMA table_info(${table})`);
  return r.rows.some((row) => row.name === col);
}

async function tableExists(client, table) {
  const r = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    args: [table],
  });
  return r.rows.length > 0;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  // 0082 — CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS, idempotent
  {
    const sql = await fs.readFile(path.join(process.cwd(), MIGRATIONS[0]), "utf-8");
    console.log("→ 0082_voice_tool_idempotency");
    // Strip comments and split on semicolons
    const clean = sql.replace(/--[^\n]*\n/g, "");
    const statements = clean.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    const ok = await tableExists(client, "voice_tool_idempotency");
    console.log(`  voice_tool_idempotency table: ${ok ? "OK" : "MISSING"}`);
  }

  // 0083 — ALTER TABLE ADD COLUMN (not idempotent); guard manually
  {
    console.log("→ 0083_stripe_event_status");
    const already = await columnExists(client, "processed_stripe_events", "status");
    if (already) {
      console.log("  processed_stripe_events.status already exists — skipped");
    } else {
      await client.execute(
        `ALTER TABLE processed_stripe_events ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'`,
      );
      const ok = await columnExists(client, "processed_stripe_events", "status");
      console.log(`  processed_stripe_events.status: ${ok ? "added" : "FAILED"}`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
