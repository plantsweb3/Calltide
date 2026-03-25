import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the DB module before importing rate-limit
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  rateLimitEntries: {
    key: "key",
    count: "count",
    windowStart: "window_start",
    windowEnd: "window_end",
  },
}));

let rateLimit: typeof import("@/lib/rate-limit").rateLimit;
let getClientIp: typeof import("@/lib/rate-limit").getClientIp;
let rateLimitResponse: typeof import("@/lib/rate-limit").rateLimitResponse;
let RATE_LIMITS: typeof import("@/lib/rate-limit").RATE_LIMITS;

describe("Rate Limiter", () => {
  beforeEach(async () => {
    vi.resetModules();
    // Re-mock after resetModules
    vi.doMock("@/db", () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      },
    }));
    vi.doMock("@/db/schema", () => ({
      rateLimitEntries: {
        key: "key",
        count: "count",
        windowStart: "window_start",
        windowEnd: "window_end",
      },
    }));
    const mod = await import("@/lib/rate-limit");
    rateLimit = mod.rateLimit;
    getClientIp = mod.getClientIp;
    rateLimitResponse = mod.rateLimitResponse;
    RATE_LIMITS = mod.RATE_LIMITS;
  });

  it("allows requests under the limit", async () => {
    const config = { limit: 5, windowSeconds: 60 };

    const r1 = await rateLimit("test-ip-1", config);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(4);

    const r2 = await rateLimit("test-ip-1", config);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(3);
  });

  it("blocks requests over the limit", async () => {
    const config = { limit: 3, windowSeconds: 60 };

    await rateLimit("test-ip-2", config);
    await rateLimit("test-ip-2", config);
    await rateLimit("test-ip-2", config);

    const blocked = await rateLimit("test-ip-2", config);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const config = { limit: 2, windowSeconds: 1 };

    await rateLimit("test-ip-3", config);
    await rateLimit("test-ip-3", config);

    const blocked = await rateLimit("test-ip-3", config);
    expect(blocked.success).toBe(false);

    const original = Date.now;
    Date.now = () => original() + 2000;

    const allowed = await rateLimit("test-ip-3", config);
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(1);

    Date.now = original;
  });

  it("tracks different keys independently", async () => {
    const config = { limit: 2, windowSeconds: 60 };

    await rateLimit("ip-a", config);
    await rateLimit("ip-a", config);

    const blocked = await rateLimit("ip-a", config);
    expect(blocked.success).toBe(false);

    const allowed = await rateLimit("ip-b", config);
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(1);
  });

  it("returns correct limit value in result", async () => {
    const config = { limit: 10, windowSeconds: 60 };
    const result = await rateLimit("test-ip-4", config);

    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("has correct preset configurations", () => {
    expect(RATE_LIMITS.auth).toEqual({ limit: 5, windowSeconds: 60 });
    expect(RATE_LIMITS.standard).toEqual({ limit: 60, windowSeconds: 60 });
    expect(RATE_LIMITS.write).toEqual({ limit: 20, windowSeconds: 60 });
    expect(RATE_LIMITS.webhook).toEqual({ limit: 200, windowSeconds: 60 });
    expect(RATE_LIMITS.admin).toEqual({ limit: 120, windowSeconds: 60 });
    expect(RATE_LIMITS.demo).toEqual({ limit: 5, windowSeconds: 900 });
    expect(RATE_LIMITS.demoDaily).toEqual({ limit: 30, windowSeconds: 86400 });
    expect(RATE_LIMITS.passwordLogin).toEqual({ limit: 5, windowSeconds: 900 });
    expect(RATE_LIMITS.passwordReset).toEqual({ limit: 3, windowSeconds: 3600 });
    expect(RATE_LIMITS.passwordChange).toEqual({ limit: 5, windowSeconds: 3600 });
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip header", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("falls back to 'unknown' when no headers", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
      },
    });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 with correct headers", () => {
    const result = {
      success: false,
      limit: 5,
      remaining: 0,
      resetAt: Date.now() + 30000,
    };

    const response = rateLimitResponse(result);
    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });
});
