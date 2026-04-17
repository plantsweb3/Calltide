#!/usr/bin/env node
/**
 * Data repair: backfill __drizzle_migrations so drizzle-kit stops trying
 * to re-apply migrations that were already run via other paths
 * (scripts/check-migrations.mjs, manual ALTERs, apply-new-migrations.mjs).
 *
 * Reads the journal, computes SHA-256 hashes matching drizzle's algorithm
 * (plain sha256 of the raw .sql file contents), and inserts any missing
 * rows. Does NOT execute migration SQL — only updates the tracker so
 * `npm run db:migrate` is a clean no-op at the current schema state.
 *
 * Safe to re-run: existing rows are identified by hash and skipped.
 */
import { createClient } from "@libsql/client";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const journalPath = path.join(process.cwd(), "src/db/migrations/meta/_journal.json");
  const journalRaw = await fs.readFile(journalPath, "utf-8");
  const journal = JSON.parse(journalRaw);

  const client = createClient({ url, authToken });

  // Existing rows
  const existing = await client.execute(
    "SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at",
  );
  const existingHashes = new Set(existing.rows.map((r) => r.hash));
  const dbMax = Math.max(0, ...existing.rows.map((r) => Number(r.created_at)));
  console.log(`DB rows: ${existing.rows.length}`);
  console.log(`DB max created_at: ${dbMax}`);
  console.log(`Journal entries: ${journal.entries.length}`);

  // Compute hash for each journal entry, check if present
  const toInsert = [];
  for (const entry of journal.entries) {
    const sqlPath = path.join(
      process.cwd(),
      "src/db/migrations",
      `${entry.tag}.sql`,
    );
    let sql;
    try {
      sql = await fs.readFile(sqlPath, "utf-8");
    } catch (err) {
      console.warn(`  skip ${entry.tag}: file not found`);
      continue;
    }
    const hash = crypto.createHash("sha256").update(sql).digest("hex");
    if (existingHashes.has(hash)) continue;
    toInsert.push({ tag: entry.tag, hash, when: entry.when });
  }

  console.log(`\nMigrations missing from tracker: ${toInsert.length}`);
  for (const m of toInsert) console.log(`  + ${m.tag} @ ${m.when}`);

  if (toInsert.length === 0) {
    console.log("\nAlready in sync — nothing to do.");
    return;
  }

  // Insert in one batch so it's all-or-nothing
  const stmts = toInsert.map((m) => ({
    sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    args: [m.hash, m.when],
  }));
  await client.batch(stmts, "write");

  // Verify
  const after = await client.execute("SELECT COUNT(*) as n FROM __drizzle_migrations");
  const afterMax = await client.execute(
    "SELECT MAX(created_at) as m FROM __drizzle_migrations",
  );
  console.log(`\nDB rows after: ${after.rows[0].n}`);
  console.log(`DB max created_at after: ${afterMax.rows[0].m}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Reconcile failed:", err);
  process.exit(1);
});
