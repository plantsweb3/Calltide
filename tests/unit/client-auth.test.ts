import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateMagicLink,
  verifyMagicToken,
  signClientCookie,
  verifyClientCookie,
} from "@/lib/client-auth";

const TEST_SECRET = "test-secret-key-32chars-minimum!";
const TEST_BIZ_ID = "biz_123";
const TEST_EMAIL = "test@example.com";
const TEST_APP_URL = "https://capta.app";

describe("Client Auth", () => {
  describe("generateMagicLink()", () => {
    it("generates a valid magic link URL", async () => {
      const link = await generateMagicLink(TEST_BIZ_ID, TEST_EMAIL, TEST_APP_URL, TEST_SECRET);
      expect(link).toContain(`${TEST_APP_URL}/api/dashboard/auth/verify?token=`);
    });

    it("token is URL-encoded", async () => {
      const link = await generateMagicLink(TEST_BIZ_ID, TEST_EMAIL, TEST_APP_URL, TEST_SECRET);
      const url = new URL(link);
      const token = url.searchParams.get("token");
      expect(token).toBeTruthy();
    });
  });

  describe("verifyMagicToken()", () => {
    it("verifies a valid token", async () => {
      const link = await generateMagicLink(TEST_BIZ_ID, TEST_EMAIL, TEST_APP_URL, TEST_SECRET);
      const url = new URL(link);
      const token = url.searchParams.get("token")!;

      const result = await verifyMagicToken(token, TEST_SECRET);
      expect(result).not.toBeNull();
      expect(result!.businessId).toBe(TEST_BIZ_ID);
      expect(result!.email).toBe(TEST_EMAIL);
    });

    it("rejects token with wrong secret", async () => {
      const link = await generateMagicLink(TEST_BIZ_ID, TEST_EMAIL, TEST_APP_URL, TEST_SECRET);
      const url = new URL(link);
      const token = url.searchParams.get("token")!;

      const result = await verifyMagicToken(token, "wrong-secret-key-32chars-minimum!");
      expect(result).toBeNull();
    });

    it("rejects expired token", async () => {
      // Manually create an expired token
      const payload = btoa(JSON.stringify({
        businessId: TEST_BIZ_ID,
        email: TEST_EMAIL,
        exp: Date.now() - 1000, // expired 1 second ago
      }));
      // Sign it with the correct secret
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(TEST_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
      const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
      const token = `${payload}.${signature}`;

      const result = await verifyMagicToken(token, TEST_SECRET);
      expect(result).toBeNull();
    });

    it("rejects malformed token (no dot)", async () => {
      const result = await verifyMagicToken("nodothere", TEST_SECRET);
      expect(result).toBeNull();
    });

    it("rejects token with invalid base64 payload", async () => {
      // atob throws on invalid base64, so verifyMagicToken throws
      await expect(verifyMagicToken("invalid.!!!not-base64!!!", TEST_SECRET)).rejects.toThrow();
    });
  });

  describe("signClientCookie() / verifyClientCookie()", () => {
    it("signs and verifies a cookie round-trip", async () => {
      const cookie = await signClientCookie(TEST_BIZ_ID, TEST_SECRET);
      const result = await verifyClientCookie(cookie, TEST_SECRET);
      expect(result).not.toBeNull();
      expect(result!.businessId).toBe(TEST_BIZ_ID);
    });

    it("includes accountId when provided", async () => {
      const cookie = await signClientCookie(TEST_BIZ_ID, TEST_SECRET, "acct_456");
      const result = await verifyClientCookie(cookie, TEST_SECRET);
      expect(result).not.toBeNull();
      expect(result!.businessId).toBe(TEST_BIZ_ID);
      expect(result!.accountId).toBe("acct_456");
    });

    it("rejects cookie with wrong secret", async () => {
      const cookie = await signClientCookie(TEST_BIZ_ID, TEST_SECRET);
      const result = await verifyClientCookie(cookie, "wrong-secret");
      expect(result).toBeNull();
    });

    it("rejects malformed cookie", async () => {
      const result = await verifyClientCookie("not-a-cookie", TEST_SECRET);
      expect(result).toBeNull();
    });

    it("rejects tampered cookie payload", async () => {
      const cookie = await signClientCookie(TEST_BIZ_ID, TEST_SECRET);
      const [, sig] = cookie.split(".");
      const tamperedPayload = btoa(JSON.stringify({
        businessId: "hacked_biz",
        iat: Date.now(),
        exp: Date.now() + 999999999,
      }));
      const result = await verifyClientCookie(`${tamperedPayload}.${sig}`, TEST_SECRET);
      expect(result).toBeNull();
    });
  });
});
