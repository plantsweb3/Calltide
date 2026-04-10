import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror the Zod schema from POST /api/setup/session
// Regression for P0 bug (April 10, 2026): setup page sent null UTM fields,
// schema rejected them with 400, signup was fully blocked on direct visits.
const sessionSchema = z.object({
  utmSource: z.string().max(200).nullable().optional(),
  utmMedium: z.string().max(200).nullable().optional(),
  utmCampaign: z.string().max(500).nullable().optional(),
  refCode: z.string().max(100).nullable().optional(),
  language: z.enum(["en", "es"]).nullable().optional(),
  timezone: z.string().max(100).nullable().optional(),
});

describe("POST /api/setup/session validation", () => {
  it("accepts empty body", () => {
    expect(sessionSchema.safeParse({}).success).toBe(true);
  });

  it("accepts language only", () => {
    expect(sessionSchema.safeParse({ language: "en" }).success).toBe(true);
    expect(sessionSchema.safeParse({ language: "es" }).success).toBe(true);
  });

  it("accepts all-null UTM payload from homepage direct visit (regression)", () => {
    const result = sessionSchema.safeParse({
      language: "en",
      timezone: "America/Chicago",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      refCode: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts populated UTM payload from campaign link", () => {
    const result = sessionSchema.safeParse({
      language: "en",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "launch",
      refCode: "partner123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string UTM fields", () => {
    const result = sessionSchema.safeParse({
      language: "en",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      refCode: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid language", () => {
    expect(sessionSchema.safeParse({ language: "fr" }).success).toBe(false);
  });

  it("rejects UTM fields over max length", () => {
    expect(
      sessionSchema.safeParse({ utmSource: "x".repeat(201) }).success,
    ).toBe(false);
    expect(
      sessionSchema.safeParse({ utmCampaign: "x".repeat(501) }).success,
    ).toBe(false);
    expect(
      sessionSchema.safeParse({ refCode: "x".repeat(101) }).success,
    ).toBe(false);
  });
});
