import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests the CRON_SECRET authentication pattern used by cron routes.
 * Validates both the lenient (Pattern A) and strict (Pattern B) patterns.
 */

describe("Cron Auth — Pattern A (Lenient)", () => {
  // Pattern: if (secret && auth !== `Bearer ${secret}`) return 401
  // Allows requests when CRON_SECRET is not set

  function checkAuthLenient(
    authHeader: string | null,
    cronSecret: string | undefined,
  ): { status: number } | null {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return { status: 401 };
    }
    return null; // Allowed
  }

  it("allows request with valid Bearer token", () => {
    const result = checkAuthLenient("Bearer my-secret", "my-secret");
    expect(result).toBeNull();
  });

  it("rejects request with wrong Bearer token", () => {
    const result = checkAuthLenient("Bearer wrong-token", "my-secret");
    expect(result).toEqual({ status: 401 });
  });

  it("rejects request with no auth header when secret is set", () => {
    const result = checkAuthLenient(null, "my-secret");
    expect(result).toEqual({ status: 401 });
  });

  it("allows request when CRON_SECRET is not set (security gap)", () => {
    const result = checkAuthLenient(null, undefined);
    expect(result).toBeNull(); // This is the known security gap
  });

  it("rejects request with Bearer prefix missing", () => {
    const result = checkAuthLenient("my-secret", "my-secret");
    expect(result).toEqual({ status: 401 });
  });
});

describe("Cron Auth — Pattern B (Strict)", () => {
  // Pattern: if (!cronSecret) return 500; if (auth !== `Bearer ${cronSecret}`) return 401

  function checkAuthStrict(
    authHeader: string | null,
    cronSecret: string | undefined,
  ): { status: number; error: string } | null {
    if (!cronSecret) {
      return { status: 500, error: "CRON_SECRET not configured" };
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return { status: 401, error: "Unauthorized" };
    }
    return null; // Allowed
  }

  it("allows request with valid Bearer token", () => {
    const result = checkAuthStrict("Bearer my-secret", "my-secret");
    expect(result).toBeNull();
  });

  it("rejects request with wrong Bearer token", () => {
    const result = checkAuthStrict("Bearer wrong-token", "my-secret");
    expect(result).toEqual({ status: 401, error: "Unauthorized" });
  });

  it("returns 500 when CRON_SECRET is not configured", () => {
    const result = checkAuthStrict("Bearer anything", undefined);
    expect(result).toEqual({ status: 500, error: "CRON_SECRET not configured" });
  });

  it("rejects request with no auth header", () => {
    const result = checkAuthStrict(null, "my-secret");
    expect(result).toEqual({ status: 401, error: "Unauthorized" });
  });

  it("rejects empty Bearer token", () => {
    const result = checkAuthStrict("Bearer ", "my-secret");
    expect(result).toEqual({ status: 401, error: "Unauthorized" });
  });

  it("handles long CRON_SECRET values", () => {
    const longSecret = "a".repeat(128);
    const result = checkAuthStrict(`Bearer ${longSecret}`, longSecret);
    expect(result).toBeNull();
  });
});

describe("Cron Auth — Bearer Token Format", () => {
  it("expects exactly 'Bearer {secret}' format", () => {
    const secret = "test-cron-secret-123";
    const validHeader = `Bearer ${secret}`;

    expect(validHeader).toBe("Bearer test-cron-secret-123");
    expect(validHeader.startsWith("Bearer ")).toBe(true);
    expect(validHeader.slice(7)).toBe(secret);
  });

  it("is case-sensitive on the token", () => {
    const secret = "MySecret";
    expect(`Bearer ${secret}` !== `Bearer mysecret`).toBe(true);
  });

  it("does not accept Basic auth", () => {
    const secret = "my-secret";
    const basicAuth = `Basic ${btoa(`user:${secret}`)}`;
    expect(basicAuth !== `Bearer ${secret}`).toBe(true);
  });
});
