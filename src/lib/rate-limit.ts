/**
 * Persistent rate limiter backed by Turso/SQLite.
 * Uses an in-memory cache to avoid redundant DB queries within the same process.
 * On deploy, limits survive via DB persistence.
 */

import { db } from "@/db";
import { rateLimitEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// L1 in-memory cache — avoids DB round-trip for repeated checks within same process
const cache = new Map<string, RateLimitEntry>();
const MAX_CACHE_SIZE = 10_000;

let lastCleanup = Date.now();
function cleanupCache() {
  const now = Date.now();
  if (cache.size <= MAX_CACHE_SIZE && now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of cache) {
    if (entry.resetAt < now) cache.delete(key);
  }
  // Hard eviction: if still over limit, drop oldest entries
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = [...cache.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) cache.delete(key);
  }
}

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limit check. Uses in-memory cache with DB write-through.
 * First request per key: reads from DB (persists across deploys).
 * Subsequent requests: served from in-memory cache (fast path).
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  cleanupCache();

  const now = Date.now();
  let entry = cache.get(identifier);

  // L1 cache hit — fast path
  if (entry && entry.resetAt >= now) {
    entry.count++;
    const remaining = Math.max(0, config.limit - entry.count);

    // Write-through to DB (fire-and-forget for performance)
    persistEntry(identifier, entry).catch(() => {});

    if (entry.count > config.limit) {
      return { success: false, limit: config.limit, remaining: 0, resetAt: entry.resetAt };
    }
    return { success: true, limit: config.limit, remaining, resetAt: entry.resetAt };
  }

  // L1 cache miss — check DB for persisted entry (survives deploys)
  try {
    const [dbEntry] = await db
      .select()
      .from(rateLimitEntries)
      .where(eq(rateLimitEntries.key, identifier))
      .limit(1);

    if (dbEntry) {
      const windowEnd = new Date(dbEntry.windowEnd).getTime();
      if (windowEnd >= now) {
        // Active window found in DB — restore to cache
        entry = { count: dbEntry.count + 1, resetAt: windowEnd };
        cache.set(identifier, entry);
        persistEntry(identifier, entry).catch(() => {});

        const remaining = Math.max(0, config.limit - entry.count);
        if (entry.count > config.limit) {
          return { success: false, limit: config.limit, remaining: 0, resetAt: entry.resetAt };
        }
        return { success: true, limit: config.limit, remaining, resetAt: entry.resetAt };
      }
    }
  } catch {
    // DB unavailable — fall through to create new window in memory only
  }

  // New window
  const resetAt = now + config.windowSeconds * 1000;
  entry = { count: 1, resetAt };
  cache.set(identifier, entry);
  persistEntry(identifier, entry).catch(() => {});

  return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt };
}

/** Persist rate limit entry to DB (upsert). */
async function persistEntry(key: string, entry: RateLimitEntry): Promise<void> {
  const windowEnd = new Date(entry.resetAt).toISOString();
  const windowStart = new Date(entry.resetAt - 60_000).toISOString(); // approximate

  await db
    .insert(rateLimitEntries)
    .values({ key, count: entry.count, windowStart, windowEnd })
    .onConflictDoUpdate({
      target: rateLimitEntries.key,
      set: { count: entry.count, windowEnd },
    });
}

/**
 * Extract a rate-limit identifier from a request.
 * Uses X-Forwarded-For (Vercel/Cloudflare) or falls back to a generic key.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns a 429 Response with rate limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
    },
  });
}

// Preset configs
export const RATE_LIMITS = {
  /** Auth endpoints: 5 attempts per minute */
  auth: { limit: 5, windowSeconds: 60 },
  /** Standard API: 60 requests per minute */
  standard: { limit: 60, windowSeconds: 60 },
  /** Write operations: 20 per minute */
  write: { limit: 20, windowSeconds: 60 },
  /** Webhooks: 200 per minute (service-to-service) */
  webhook: { limit: 200, windowSeconds: 60 },
  /** Admin API: 120 per minute */
  admin: { limit: 120, windowSeconds: 60 },
  /** Demo sessions: 5 per IP per 15 minutes */
  demo: { limit: 5, windowSeconds: 900 },
  /** Demo daily cap: 30 per IP per 24 hours */
  demoDaily: { limit: 30, windowSeconds: 86400 },
  /** Password login: 5 attempts per 15 minutes */
  passwordLogin: { limit: 5, windowSeconds: 900 },
  /** Password reset requests: 3 per hour */
  passwordReset: { limit: 3, windowSeconds: 3600 },
  /** Password change: 5 per hour */
  passwordChange: { limit: 5, windowSeconds: 3600 },
} as const;
