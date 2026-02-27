/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per IP address.
 *
 * For production at scale, swap for Redis/Upstash-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10_000;

// Clean up expired entries periodically (every 60s) or when store exceeds cap
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  const overCap = store.size > MAX_STORE_SIZE;
  if (!overCap && now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
  // If still over cap after clearing expired, evict oldest entries
  if (store.size > MAX_STORE_SIZE) {
    const excess = store.size - MAX_STORE_SIZE;
    let removed = 0;
    for (const key of store.keys()) {
      if (removed >= excess) break;
      store.delete(key);
      removed++;
    }
  }
}

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt: now + config.windowSeconds * 1000 };
  }

  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);

  if (entry.count > config.limit) {
    return { success: false, limit: config.limit, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, limit: config.limit, remaining, resetAt: entry.resetAt };
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
} as const;
