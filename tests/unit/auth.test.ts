import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateMagicLink,
  verifyMagicToken,
  signClientCookie,
  verifyClientCookie,
} from "@/lib/client-auth";

const TEST_SECRET = "test-secret-key-for-hmac-signing";
const TEST_APP_URL = "https://app.calltide.test";

describe("Client Auth — Magic Links", () => {
  it("generates a valid magic link URL", async () => {
    const link = await generateMagicLink("biz_001", "test@example.com", TEST_APP_URL, TEST_SECRET);

    expect(link).toContain(`${TEST_APP_URL}/api/dashboard/auth/verify?token=`);
    const url = new URL(link);
    const token = url.searchParams.get("token");
    expect(token).toBeTruthy();
  });

  it("verifies a valid magic link token", async () => {
    const link = await generateMagicLink("biz_001", "test@example.com", TEST_APP_URL, TEST_SECRET);
    const url = new URL(link);
    const token = url.searchParams.get("token")!;

    const result = await verifyMagicToken(token, TEST_SECRET);
    expect(result).toEqual({ businessId: "biz_001", email: "test@example.com" });
  });

  it("rejects expired magic link token", async () => {
    // Generate a token, then mock Date.now to be 16 minutes in the future
    const link = await generateMagicLink("biz_001", "test@example.com", TEST_APP_URL, TEST_SECRET);
    const url = new URL(link);
    const token = url.searchParams.get("token")!;

    // Advance time by 16 minutes (magic links expire after 15 min)
    const original = Date.now;
    Date.now = () => original() + 16 * 60 * 1000;

    const result = await verifyMagicToken(token, TEST_SECRET);
    expect(result).toBeNull();

    Date.now = original;
  });

  it("rejects token with wrong secret", async () => {
    const link = await generateMagicLink("biz_001", "test@example.com", TEST_APP_URL, TEST_SECRET);
    const url = new URL(link);
    const token = url.searchParams.get("token")!;

    const result = await verifyMagicToken(token, "wrong-secret");
    expect(result).toBeNull();
  });

  it("rejects tampered token payload", async () => {
    const link = await generateMagicLink("biz_001", "test@example.com", TEST_APP_URL, TEST_SECRET);
    const url = new URL(link);
    const token = url.searchParams.get("token")!;

    // Tamper with the payload (change first char)
    const tampered = "X" + token.slice(1);
    const result = await verifyMagicToken(tampered, TEST_SECRET);
    expect(result).toBeNull();
  });

  it("rejects token without dot separator", async () => {
    const result = await verifyMagicToken("nodothere", TEST_SECRET);
    expect(result).toBeNull();
  });

  it("rejects empty token", async () => {
    const result = await verifyMagicToken("", TEST_SECRET);
    expect(result).toBeNull();
  });
});

describe("Client Auth — Session Cookies", () => {
  it("creates and verifies a valid session cookie", async () => {
    const cookie = await signClientCookie("biz_001", TEST_SECRET);
    const result = await verifyClientCookie(cookie, TEST_SECRET);

    expect(result).toEqual({ businessId: "biz_001", accountId: undefined });
  });

  it("rejects cookie with wrong secret", async () => {
    const cookie = await signClientCookie("biz_001", TEST_SECRET);
    const result = await verifyClientCookie(cookie, "wrong-secret");

    expect(result).toBeNull();
  });

  it("rejects expired cookie", async () => {
    const cookie = await signClientCookie("biz_001", TEST_SECRET);

    // Advance time by 8 days (cookies expire after 7 days)
    const original = Date.now;
    Date.now = () => original() + 8 * 24 * 60 * 60 * 1000;

    const result = await verifyClientCookie(cookie, TEST_SECRET);
    expect(result).toBeNull();

    Date.now = original;
  });

  it("rejects tampered cookie", async () => {
    const cookie = await signClientCookie("biz_001", TEST_SECRET);
    const tampered = "X" + cookie.slice(1);

    const result = await verifyClientCookie(tampered, TEST_SECRET);
    expect(result).toBeNull();
  });

  it("rejects cookie without dot separator", async () => {
    const result = await verifyClientCookie("noseparator", TEST_SECRET);
    expect(result).toBeNull();
  });

  it("extracts correct businessId from cookie payload", async () => {
    const cookie = await signClientCookie("biz_specific_123", TEST_SECRET);
    const result = await verifyClientCookie(cookie, TEST_SECRET);

    expect(result).toEqual({ businessId: "biz_specific_123", accountId: undefined });
  });
});
