import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("@/db", () => {
  const createChain = (returnValue: unknown[] = []) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(returnValue),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
  });

  return {
    db: {
      select: vi.fn(() => createChain()),
      insert: vi.fn(() => createChain()),
    },
  };
});

vi.mock("@/db/schema", () => ({
  outreachLog: {
    id: "id",
    businessId: "businessId",
    source: "source",
    channel: "channel",
    sentAt: "sentAt",
  },
}));

describe("canContactToday()", () => {
  let canContactToday: typeof import("@/lib/outreach").canContactToday;
  let db: { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const dbMod = await import("@/db");
    db = dbMod.db as unknown as typeof db;

    const mod = await import("@/lib/outreach");
    canContactToday = mod.canContactToday;
  });

  it("returns true when no outreach logged today", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No records found
    };
    db.select.mockReturnValue(chain);

    const result = await canContactToday("biz_001");
    expect(result).toBe(true);
  });

  it("returns false when outreach already logged today", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "ol_existing" }]), // Record found
    };
    db.select.mockReturnValue(chain);

    const result = await canContactToday("biz_001");
    expect(result).toBe(false);
  });
});

describe("logOutreach()", () => {
  let logOutreach: typeof import("@/lib/outreach").logOutreach;
  let db: { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const dbMod = await import("@/db");
    db = dbMod.db as unknown as typeof db;

    const mod = await import("@/lib/outreach");
    logOutreach = mod.logOutreach;
  });

  it("creates outreach log entry with correct fields", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    await logOutreach("biz_001", "dunning", "email");

    expect(db.insert).toHaveBeenCalled();
    expect(insertChain.values).toHaveBeenCalledWith({
      businessId: "biz_001",
      source: "dunning",
      channel: "email",
    });
  });

  it("records SMS channel correctly", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    await logOutreach("biz_002", "churn_agent", "sms");

    expect(insertChain.values).toHaveBeenCalledWith({
      businessId: "biz_002",
      source: "churn_agent",
      channel: "sms",
    });
  });

  it("accepts all valid source types", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    const sources = ["dunning", "churn_agent", "success_agent", "nudge_agent", "incident"] as const;

    for (const source of sources) {
      await logOutreach("biz_001", source, "email");
    }

    expect(db.insert).toHaveBeenCalledTimes(5);
  });
});
