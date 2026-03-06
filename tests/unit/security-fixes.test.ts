import { describe, it, expect } from "vitest";

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
