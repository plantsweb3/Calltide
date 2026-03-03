import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isStripeConfigured,
  isTwilioConfigured,
  isHumeConfigured,
  isResendConfigured,
  isAnthropicConfigured,
  isSentryConfigured,
} from "@/lib/integrations";

describe("Integration availability checks", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isStripeConfigured()", () => {
    it("returns true when both keys present", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_123";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
      expect(isStripeConfigured()).toBe(true);
    });

    it("returns false when secret key missing", () => {
      delete process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
      expect(isStripeConfigured()).toBe(false);
    });

    it("returns false when webhook secret missing", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_123";
      delete process.env.STRIPE_WEBHOOK_SECRET;
      expect(isStripeConfigured()).toBe(false);
    });

    it("returns false when both missing", () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      expect(isStripeConfigured()).toBe(false);
    });
  });

  describe("isTwilioConfigured()", () => {
    it("returns true when all three keys present", () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token";
      process.env.TWILIO_PHONE_NUMBER = "+15125551234";
      expect(isTwilioConfigured()).toBe(true);
    });

    it("returns false when SID missing", () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      process.env.TWILIO_AUTH_TOKEN = "token";
      process.env.TWILIO_PHONE_NUMBER = "+15125551234";
      expect(isTwilioConfigured()).toBe(false);
    });

    it("returns false when phone number missing", () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token";
      delete process.env.TWILIO_PHONE_NUMBER;
      expect(isTwilioConfigured()).toBe(false);
    });
  });

  describe("isHumeConfigured()", () => {
    it("returns true when all three keys present", () => {
      process.env.HUME_API_KEY = "key";
      process.env.HUME_SECRET_KEY = "secret";
      process.env.HUME_CONFIG_ID = "config";
      expect(isHumeConfigured()).toBe(true);
    });

    it("returns false when any key missing", () => {
      process.env.HUME_API_KEY = "key";
      delete process.env.HUME_SECRET_KEY;
      process.env.HUME_CONFIG_ID = "config";
      expect(isHumeConfigured()).toBe(false);
    });
  });

  describe("isResendConfigured()", () => {
    it("returns true when key present", () => {
      process.env.RESEND_API_KEY = "re_123";
      expect(isResendConfigured()).toBe(true);
    });

    it("returns false when key missing", () => {
      delete process.env.RESEND_API_KEY;
      expect(isResendConfigured()).toBe(false);
    });
  });

  describe("isAnthropicConfigured()", () => {
    it("returns true when key present", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-123";
      expect(isAnthropicConfigured()).toBe(true);
    });

    it("returns false when key missing", () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(isAnthropicConfigured()).toBe(false);
    });
  });

  describe("isSentryConfigured()", () => {
    it("returns true when DSN present", () => {
      process.env.SENTRY_DSN = "https://sentry.io/123";
      expect(isSentryConfigured()).toBe(true);
    });

    it("returns false when DSN missing", () => {
      delete process.env.SENTRY_DSN;
      expect(isSentryConfigured()).toBe(false);
    });
  });
});
