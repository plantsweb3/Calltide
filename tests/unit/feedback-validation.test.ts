import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror the Zod schema from the feedback API route
const createSchema = z.object({
  type: z.enum(["feedback", "feature_request", "bug_report"]),
  category: z.enum(["general", "calls", "billing", "appointments", "sms", "other"]),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
});

const updateSchema = z.object({
  status: z.enum(["new", "acknowledged", "in_progress", "resolved", "declined"]).optional(),
  adminResponse: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

describe("Feedback create validation", () => {
  it("accepts valid feedback", () => {
    const result = createSchema.safeParse({
      type: "feedback",
      category: "general",
      title: "Great service!",
      description: "I really love how the AI handles my calls.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid types", () => {
    for (const type of ["feedback", "feature_request", "bug_report"]) {
      const result = createSchema.safeParse({
        type,
        category: "general",
        title: "Test title",
        description: "Test description for validation",
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid categories", () => {
    for (const category of ["general", "calls", "billing", "appointments", "sms", "other"]) {
      const result = createSchema.safeParse({
        type: "feedback",
        category,
        title: "Test title",
        description: "Test description for validation",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid type", () => {
    const result = createSchema.safeParse({
      type: "invalid_type",
      category: "general",
      title: "Test",
      description: "Test description for validation",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title too short", () => {
    const result = createSchema.safeParse({
      type: "feedback",
      category: "general",
      title: "Hi",
      description: "Test description for validation",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description too short", () => {
    const result = createSchema.safeParse({
      type: "feedback",
      category: "general",
      title: "Valid title",
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title too long", () => {
    const result = createSchema.safeParse({
      type: "feedback",
      category: "general",
      title: "A".repeat(201),
      description: "Test description for validation",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = createSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("Feedback update validation", () => {
  it("accepts valid status update", () => {
    const result = updateSchema.safeParse({ status: "resolved" });
    expect(result.success).toBe(true);
  });

  it("accepts valid priority update", () => {
    const result = updateSchema.safeParse({ priority: "high" });
    expect(result.success).toBe(true);
  });

  it("accepts admin response", () => {
    const result = updateSchema.safeParse({
      adminResponse: "Thank you for the feedback, we are working on this!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateSchema.safeParse({ status: "invalid_status" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = updateSchema.safeParse({ priority: "ultra_high" });
    expect(result.success).toBe(false);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["new", "acknowledged", "in_progress", "resolved", "declined"]) {
      const result = updateSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });
});
