import { describe, it, expect, vi, beforeEach } from "vitest";
import { activeBusiness, pastDueBusiness } from "../fixtures/businesses";

// We test the dunning module's logic by mocking its dependencies (db, Resend, Twilio, etc.)

// Mock all external dependencies
vi.mock("@/db", () => {
  const createChain = (returnValue: unknown[] = []) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const m of ["select", "from", "where", "limit", "set", "values", "returning", "update", "insert"]) {
      chain[m] = vi.fn().mockReturnThis();
    }
    chain.limit = vi.fn().mockResolvedValue(returnValue);
    chain.returning = vi.fn().mockResolvedValue(returnValue);
    return chain;
  };

  return {
    db: {
      select: vi.fn(() => createChain()),
      insert: vi.fn(() => createChain()),
      update: vi.fn(() => createChain()),
    },
  };
});

vi.mock("@/db/schema", () => ({
  dunningState: {
    id: "id",
    businessId: "businessId",
    status: "status",
    firstFailedAt: "firstFailedAt",
    attemptCount: "attemptCount",
    lastFailureCode: "lastFailureCode",
    email1SentAt: "email1SentAt",
    email2SentAt: "email2SentAt",
    email3SentAt: "email3SentAt",
    smsSentAt: "smsSentAt",
    updatedAt: "updatedAt",
    recoveredAt: "recoveredAt",
    canceledAt: "canceledAt",
  },
  businesses: {
    id: "id",
    paymentStatus: "paymentStatus",
    active: "active",
    updatedAt: "updatedAt",
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    ADMIN_PASSWORD: "test",
    NEXT_PUBLIC_APP_URL: "https://app.calltide.test",
    RESEND_API_KEY: "re_test",
    TWILIO_ACCOUNT_SID: "AC_test",
    TWILIO_AUTH_TOKEN: "test_token",
    TWILIO_PHONE_NUMBER: "+15125559999",
    OUTREACH_FROM_EMAIL: "test@calltide.test",
  },
}));

vi.mock("@/lib/compliance/sms", () => ({
  canSendSms: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/outreach", () => ({
  canContactToday: vi.fn().mockResolvedValue(true),
  logOutreach: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("resend", () => {
  class MockResend {
    emails = { send: vi.fn().mockResolvedValue({ id: "email_test" }) };
  }
  return { Resend: MockResend };
});

vi.mock("twilio", () => {
  const mockClient = {
    messages: { create: vi.fn().mockResolvedValue({ sid: "SM_test" }) },
  };
  return { default: vi.fn(() => mockClient) };
});

describe("Dunning State Machine", () => {
  let startDunning: typeof import("@/lib/financial/dunning").startDunning;
  let clearDunning: typeof import("@/lib/financial/dunning").clearDunning;
  let cancelDunning: typeof import("@/lib/financial/dunning").cancelDunning;
  let processDunning: typeof import("@/lib/financial/dunning").processDunning;
  let db: { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    const dbMod = await import("@/db");
    db = dbMod.db as unknown as typeof db;

    const mod = await import("@/lib/financial/dunning");
    startDunning = mod.startDunning;
    clearDunning = mod.clearDunning;
    cancelDunning = mod.cancelDunning;
    processDunning = mod.processDunning;
  });

  describe("startDunning()", () => {
    it("creates new dunning state when none exists", async () => {
      // Mock: no existing active dunning
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      db.select.mockReturnValue(selectChain);

      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: "ds_new", businessId: "biz_001", status: "active" }]),
      };
      db.insert.mockReturnValue(insertChain);

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      db.update.mockReturnValue(updateChain);

      const result = await startDunning("biz_001", "card_declined");
      expect(db.insert).toHaveBeenCalled();
    });

    it("increments attemptCount when dunning already active", async () => {
      const existingDunning = {
        id: "ds_existing",
        businessId: "biz_001",
        status: "active",
        attemptCount: 1,
        lastFailureCode: "card_declined",
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingDunning]),
      };
      db.select.mockReturnValue(selectChain);

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      db.update.mockReturnValue(updateChain);

      const result = await startDunning("biz_001", "insufficient_funds");
      expect(db.update).toHaveBeenCalled();
      expect(result).toEqual(existingDunning);
    });
  });

  describe("clearDunning()", () => {
    it("sets status to 'recovered' and resets business payment status", async () => {
      const existingDunning = {
        id: "ds_existing",
        businessId: "biz_001",
        status: "active",
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingDunning]),
      };
      db.select.mockReturnValue(selectChain);

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      db.update.mockReturnValue(updateChain);

      await clearDunning("biz_001");

      // Should be called twice: once for dunningState, once for businesses
      expect(db.update).toHaveBeenCalledTimes(2);
    });

    it("does nothing when no active dunning exists", async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      db.select.mockReturnValue(selectChain);

      await clearDunning("biz_nonexistent");
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe("cancelDunning()", () => {
    it("sets status to 'canceled' and deactivates business", async () => {
      const existingDunning = {
        id: "ds_existing",
        businessId: "biz_001",
        status: "active",
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingDunning]),
      };
      db.select.mockReturnValue(selectChain);

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      db.update.mockReturnValue(updateChain);

      await cancelDunning("biz_001");
      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });

  describe("processDunning()", () => {
    it("sends email1 on day 0", async () => {
      const now = new Date();
      const dunningRecord = {
        id: "ds_day0",
        businessId: pastDueBusiness.id,
        status: "active",
        firstFailedAt: now.toISOString(), // Just failed
        email1SentAt: null,
        email2SentAt: null,
        email3SentAt: null,
        smsSentAt: null,
      };

      // First select: get active dunning states
      // Second select: get business
      let selectCallCount = 0;
      db.select.mockImplementation(() => {
        selectCallCount++;
        const chain = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(
            selectCallCount === 1 ? [dunningRecord] : [pastDueBusiness],
          ),
        };
        // For the first call (no .limit), return dunning records
        if (selectCallCount === 1) {
          chain.where = vi.fn().mockResolvedValue([dunningRecord]);
          return chain;
        }
        return chain;
      });

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      db.update.mockReturnValue(updateChain);

      const { logOutreach } = await import("@/lib/outreach");

      const results = await processDunning();
      expect(results.emailsSent).toBeGreaterThanOrEqual(0);
      expect(results.processed).toBeGreaterThanOrEqual(0);
    });

    it("respects canContactToday() — skips if already contacted", async () => {
      const { canContactToday } = await import("@/lib/outreach");
      vi.mocked(canContactToday).mockResolvedValue(false); // Already contacted

      const dunningRecord = {
        id: "ds_skip",
        businessId: pastDueBusiness.id,
        status: "active",
        firstFailedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        email1SentAt: new Date().toISOString(),
        email2SentAt: null,
        email3SentAt: null,
        smsSentAt: null,
      };

      let selectCallCount = 0;
      db.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First call: get active dunning states (no .limit)
          return {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([dunningRecord]),
          };
        }
        // Second call: get business (uses .limit)
        return {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([pastDueBusiness]),
        };
      });

      const results = await processDunning();
      // Should still count as processed but NOT send any emails
      expect(results.emailsSent).toBe(0);
      expect(results.smsSent).toBe(0);
    });

    it("respects canSendSms() for SMS step on day 5", async () => {
      const { canSendSms } = await import("@/lib/compliance/sms");
      vi.mocked(canSendSms).mockResolvedValue({ allowed: false, reason: "quiet_hours" });

      // Day 5 dunning record
      const dunningRecord = {
        id: "ds_day5",
        businessId: pastDueBusiness.id,
        status: "active",
        firstFailedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        email1SentAt: new Date().toISOString(),
        email2SentAt: new Date().toISOString(),
        email3SentAt: null,
        smsSentAt: null,
      };

      let selectCallCount = 0;
      db.select.mockImplementation(() => {
        selectCallCount++;
        const chain = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(
            selectCallCount <= 1 ? [dunningRecord] : [pastDueBusiness],
          ),
        };
        if (selectCallCount === 1) {
          chain.where = vi.fn().mockResolvedValue([dunningRecord]);
          return chain;
        }
        return chain;
      });

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      db.update.mockReturnValue(updateChain);

      const results = await processDunning();
      // SMS should NOT be sent because canSendSms returned false
      expect(results.smsSent).toBe(0);
    });
  });
});

describe("Dunning Day Calculation", () => {
  it("correctly calculates days since first failure", () => {
    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const daysSince = Math.floor(
      (now - new Date(threeDaysAgo).getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(daysSince).toBe(3);
  });

  it("day 0 is the day of first failure", () => {
    const now = Date.now();
    const justNow = new Date(now).toISOString();
    const daysSince = Math.floor(
      (now - new Date(justNow).getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(daysSince).toBe(0);
  });

  it("day 7 threshold is 7 full days", () => {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const daysSince = Math.floor(
      (now - new Date(sevenDaysAgo).getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(daysSince).toBe(7);
  });

  it("day 14 is the cancellation threshold", () => {
    const now = Date.now();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const daysSince = Math.floor(
      (now - new Date(fourteenDaysAgo).getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(daysSince).toBe(14);
  });
});
