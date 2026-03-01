import { describe, it, expect } from "vitest";
import {
  isStripeConfigured,
  isTwilioConfigured,
  isHumeConfigured,
  isResendConfigured,
  isAnthropicConfigured,
  isSentryConfigured,
} from "@/lib/integrations";

describe("Integration helpers", () => {
  it("isStripeConfigured returns false when keys missing", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(isStripeConfigured()).toBe(false);
  });

  it("isStripeConfigured returns true when both keys present", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    expect(isStripeConfigured()).toBe(true);
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("isTwilioConfigured checks all three keys", () => {
    expect(isTwilioConfigured()).toBe(false);
    process.env.TWILIO_ACCOUNT_SID = "ACxxx";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_PHONE_NUMBER = "+1234567890";
    expect(isTwilioConfigured()).toBe(true);
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  it("isHumeConfigured checks all three keys", () => {
    expect(isHumeConfigured()).toBe(false);
    process.env.HUME_API_KEY = "key";
    process.env.HUME_SECRET_KEY = "secret";
    process.env.HUME_CONFIG_ID = "config";
    expect(isHumeConfigured()).toBe(true);
    delete process.env.HUME_API_KEY;
    delete process.env.HUME_SECRET_KEY;
    delete process.env.HUME_CONFIG_ID;
  });

  it("isResendConfigured checks RESEND_API_KEY", () => {
    expect(isResendConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_xxx";
    expect(isResendConfigured()).toBe(true);
    delete process.env.RESEND_API_KEY;
  });

  it("isAnthropicConfigured checks ANTHROPIC_API_KEY", () => {
    expect(isAnthropicConfigured()).toBe(false);
    process.env.ANTHROPIC_API_KEY = "sk-ant-xxx";
    expect(isAnthropicConfigured()).toBe(true);
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("isSentryConfigured checks SENTRY_DSN", () => {
    expect(isSentryConfigured()).toBe(false);
    process.env.SENTRY_DSN = "https://xxx@sentry.io/123";
    expect(isSentryConfigured()).toBe(true);
    delete process.env.SENTRY_DSN;
  });
});

describe("NaN clamping (unit logic)", () => {
  it("clamps NaN to default for parseInt failures", () => {
    // Simulate the fix pattern from activity-feed/route.ts
    const parsed = parseInt("abc", 10);
    const limit = Math.min(Math.max(1, Number.isNaN(parsed) ? 30 : parsed), 100);
    expect(limit).toBe(30);
  });

  it("clamps valid numbers within bounds", () => {
    const parsed = parseInt("200", 10);
    const limit = Math.min(Math.max(1, Number.isNaN(parsed) ? 30 : parsed), 100);
    expect(limit).toBe(100);
  });

  it("clamps negative numbers to 1", () => {
    const parsed = parseInt("-5", 10);
    const limit = Math.min(Math.max(1, Number.isNaN(parsed) ? 30 : parsed), 100);
    expect(limit).toBe(1);
  });

  it("passes valid numbers through", () => {
    const parsed = parseInt("25", 10);
    const limit = Math.min(Math.max(1, Number.isNaN(parsed) ? 30 : parsed), 100);
    expect(limit).toBe(25);
  });
});

describe("sortBy validation (unit logic)", () => {
  it("rejects invalid sort column names", () => {
    const SORT_COLUMN_MAP: Record<string, string> = {
      createdAt: "created_at",
      businessName: "business_name",
      leadScore: "lead_score",
    };

    const sortByParam = "malicious_column; DROP TABLE";
    expect(sortByParam in SORT_COLUMN_MAP).toBe(false);
  });

  it("accepts valid sort column names", () => {
    const SORT_COLUMN_MAP: Record<string, string> = {
      createdAt: "created_at",
      businessName: "business_name",
      leadScore: "lead_score",
    };

    expect("createdAt" in SORT_COLUMN_MAP).toBe(true);
    expect("businessName" in SORT_COLUMN_MAP).toBe(true);
    expect("leadScore" in SORT_COLUMN_MAP).toBe(true);
  });
});
