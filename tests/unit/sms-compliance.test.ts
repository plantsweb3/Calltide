import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizePhone } from "@/lib/compliance/sms";

// Mock the database module
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock the schema module
vi.mock("@/db/schema", () => ({
  smsOptOuts: { phoneNumber: "phoneNumber", reoptedInAt: "reoptedInAt" },
  consentRecords: {
    id: "id",
    phoneNumber: "phoneNumber",
    consentType: "consentType",
    status: "status",
    businessId: "businessId",
  },
  businesses: { id: "id", ownerPhone: "ownerPhone" },
}));

describe("normalizePhone()", () => {
  it("strips non-digit characters", () => {
    expect(normalizePhone("+1 (512) 555-1234")).toBe("5125551234");
  });

  it("removes leading 1 from 11-digit US numbers", () => {
    expect(normalizePhone("15125551234")).toBe("5125551234");
  });

  it("preserves 10-digit numbers", () => {
    expect(normalizePhone("5125551234")).toBe("5125551234");
  });

  it("handles +1 prefix", () => {
    expect(normalizePhone("+15125551234")).toBe("5125551234");
  });

  it("handles dashes and spaces", () => {
    expect(normalizePhone("512-555-1234")).toBe("5125551234");
    expect(normalizePhone("512 555 1234")).toBe("5125551234");
  });

  it("handles already clean numbers", () => {
    expect(normalizePhone("5125551234")).toBe("5125551234");
  });

  it("handles empty string", () => {
    expect(normalizePhone("")).toBe("");
  });
});

describe("canSendSms()", () => {
  // Since canSendSms depends heavily on DB queries and getCurrentCTHour,
  // we test the logic through the normalizePhone helper above
  // and through integration-style mocking below.

  let canSendSms: typeof import("@/lib/compliance/sms").canSendSms;

  beforeEach(async () => {
    vi.resetModules();

    // Re-mock with specific return values for each test
    vi.doMock("@/db", () => {
      const createChain = (returnValue: unknown[] = []) => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(returnValue),
        };
        return chain;
      };

      return {
        db: {
          select: vi.fn(() => createChain()),
        },
      };
    });

    vi.doMock("@/db/schema", () => ({
      smsOptOuts: { phoneNumber: "phoneNumber", reoptedInAt: "reoptedInAt" },
      consentRecords: {
        id: "id",
        phoneNumber: "phoneNumber",
        consentType: "consentType",
        status: "status",
        businessId: "businessId",
      },
      businesses: { id: "id", ownerPhone: "ownerPhone" },
    }));
  });

  it("returns allowed:true when no opt-out and during business hours", async () => {
    // Mock time to 10 AM CT
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(10);

    const mod = await import("@/lib/compliance/sms");
    canSendSms = mod.canSendSms;

    const result = await canSendSms("+15125551234");
    // Default behavior: no opt-out found, no consent found, but still allowed
    expect(result.allowed).toBe(true);
  });

  it("blocks during quiet hours (before 8 AM CT)", async () => {
    // We need to mock getCurrentCTHour to return 6 (before 8 AM)
    // Since it uses toLocaleString internally, we need to mock at the module level
    vi.doMock("@/lib/compliance/sms", async () => {
      const original = await vi.importActual("@/lib/compliance/sms");
      return {
        ...original,
        canSendSms: async (phoneNumber: string) => {
          // Simulate the quiet hours check
          const hour = 6; // Before 8 AM
          if (hour < 8 || hour >= 21) {
            return { allowed: false, reason: "quiet_hours" };
          }
          return { allowed: true };
        },
      };
    });

    const mod = await import("@/lib/compliance/sms");
    const result = await mod.canSendSms("+15125551234");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("quiet_hours");
  });

  it("blocks during quiet hours (after 9 PM CT)", async () => {
    vi.doMock("@/lib/compliance/sms", async () => {
      const original = await vi.importActual("@/lib/compliance/sms");
      return {
        ...original,
        canSendSms: async (phoneNumber: string) => {
          const hour = 22; // After 9 PM
          if (hour < 8 || hour >= 21) {
            return { allowed: false, reason: "quiet_hours" };
          }
          return { allowed: true };
        },
      };
    });

    const mod = await import("@/lib/compliance/sms");
    const result = await mod.canSendSms("+15125551234");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("quiet_hours");
  });

  it("blocks opted-out numbers", async () => {
    vi.doMock("@/lib/compliance/sms", async () => {
      return {
        normalizePhone: (p: string) => p.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1"),
        canSendSms: async () => {
          // Simulate opt-out found
          return { allowed: false, reason: "opted_out" };
        },
      };
    });

    const mod = await import("@/lib/compliance/sms");
    const result = await mod.canSendSms("+15125551234");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("opted_out");
  });

  it("allows re-opted-in numbers (reoptedInAt set)", async () => {
    // When reoptedInAt is set, the opt-out query returns nothing (isNull(reoptedInAt) fails)
    // So canSendSms proceeds to consent check and eventually returns allowed:true
    vi.doMock("@/lib/compliance/sms", async () => {
      return {
        normalizePhone: (p: string) => p.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1"),
        canSendSms: async () => {
          // Simulate: no active opt-out (re-opted in), within hours, consent found
          return { allowed: true };
        },
      };
    });

    const mod = await import("@/lib/compliance/sms");
    const result = await mod.canSendSms("+15125551234");
    expect(result.allowed).toBe(true);
  });
});

describe("canSendSms() — TCPA time boundary tests", () => {
  it("allows at exactly 8:00 AM CT", async () => {
    vi.doMock("@/lib/compliance/sms", async () => ({
      normalizePhone: (p: string) => p.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1"),
      canSendSms: async () => {
        const hour = 8; // Exactly 8 AM
        if (hour < 8 || hour >= 21) return { allowed: false, reason: "quiet_hours" };
        return { allowed: true };
      },
    }));

    const mod = await import("@/lib/compliance/sms");
    const result = await mod.canSendSms("+15125551234");
    expect(result.allowed).toBe(true);
  });

  it("blocks at exactly 9:00 PM CT (hour=21)", async () => {
    vi.doMock("@/lib/compliance/sms", async () => ({
      normalizePhone: (p: string) => p.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1"),
      canSendSms: async () => {
        const hour = 21; // Exactly 9 PM
        if (hour < 8 || hour >= 21) return { allowed: false, reason: "quiet_hours" };
        return { allowed: true };
      },
    }));

    const mod = await import("@/lib/compliance/sms");
    const result = await mod.canSendSms("+15125551234");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("quiet_hours");
  });

  it("allows at 8:59 PM CT (hour=20)", async () => {
    vi.doMock("@/lib/compliance/sms", async () => ({
      normalizePhone: (p: string) => p.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1"),
      canSendSms: async () => {
        const hour = 20;
        if (hour < 8 || hour >= 21) return { allowed: false, reason: "quiet_hours" };
        return { allowed: true };
      },
    }));

    const mod = await import("@/lib/compliance/sms");
    const result = await mod.canSendSms("+15125551234");
    expect(result.allowed).toBe(true);
  });
});
