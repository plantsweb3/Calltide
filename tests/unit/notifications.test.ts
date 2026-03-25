import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("@/db", () => {
  const createChain = (returnValue: unknown = undefined) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(returnValue),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(returnValue),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  });

  return {
    db: {
      select: vi.fn(() => createChain()),
      insert: vi.fn(() => createChain()),
      update: vi.fn(() => createChain()),
    },
  };
});

vi.mock("@/db/schema", () => ({
  notifications: {
    id: "id",
    source: "source",
    severity: "severity",
    title: "title",
    message: "message",
    actionUrl: "actionUrl",
    acknowledged: "acknowledged",
    acknowledgedAt: "acknowledgedAt",
    createdAt: "createdAt",
  },
}));

describe("createNotification()", () => {
  let createNotification: typeof import("@/lib/notifications").createNotification;
  let db: { insert: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const dbMod = await import("@/db");
    db = dbMod.db as unknown as typeof db;

    const mod = await import("@/lib/notifications");
    createNotification = mod.createNotification;
  });

  it("creates notification with all required fields", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    await createNotification({
      source: "financial",
      severity: "warning",
      title: "Payment failed",
      message: "Joe's Plumbing — card_declined",
    });

    expect(db.insert).toHaveBeenCalled();
    expect(insertChain.values).toHaveBeenCalledWith({
      source: "financial",
      severity: "warning",
      title: "Payment failed",
      message: "Joe's Plumbing — card_declined",
      acknowledged: false,
    });
  });

  it("creates notification with optional actionUrl", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    await createNotification({
      source: "incident",
      severity: "critical",
      title: "Service outage",
      message: "ElevenLabs API is down",
      actionUrl: "/admin/incidents",
    });

    expect(insertChain.values).toHaveBeenCalledWith({
      source: "incident",
      severity: "critical",
      title: "Service outage",
      message: "ElevenLabs API is down",
      actionUrl: "/admin/incidents",
      acknowledged: false,
    });
  });

  it("defaults acknowledged to false", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    await createNotification({
      source: "capacity",
      severity: "info",
      title: "Test",
      message: "Test message",
    });

    const callArgs = insertChain.values.mock.calls[0][0];
    expect(callArgs.acknowledged).toBe(false);
  });

  it("accepts all valid severity levels", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    const severities = ["info", "warning", "critical", "emergency"] as const;

    for (const severity of severities) {
      await createNotification({
        source: "agents",
        severity,
        title: `${severity} test`,
        message: `Testing ${severity}`,
      });
    }

    expect(db.insert).toHaveBeenCalledTimes(4);
  });

  it("accepts all valid source types", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };
    db.insert.mockReturnValue(insertChain);

    const sources = ["capacity", "incident", "financial", "retention", "compliance", "agents", "knowledge"] as const;

    for (const source of sources) {
      await createNotification({
        source,
        severity: "info",
        title: `${source} test`,
        message: `Testing ${source}`,
      });
    }

    expect(db.insert).toHaveBeenCalledTimes(7);
  });
});
