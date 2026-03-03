import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Sentry before importing the module
vi.mock("@sentry/nextjs", () => ({
  withScope: vi.fn((cb) => {
    const scope = {
      setTag: vi.fn(),
      setExtras: vi.fn(),
      setLevel: vi.fn(),
      setTransactionName: vi.fn(),
    };
    cb(scope);
    return scope;
  }),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { reportError, reportWarning } from "@/lib/error-reporting";
import * as Sentry from "@sentry/nextjs";

describe("Error Reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("reportError()", () => {
    it("logs to console", () => {
      const error = new Error("test error");
      reportError("Something failed", error);
      expect(console.error).toHaveBeenCalledWith("Something failed", error);
    });

    it("sends Error instances to Sentry via captureException", () => {
      const error = new Error("test error");
      reportError("Something failed", error);
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("sends non-Error values to Sentry via captureMessage", () => {
      reportError("Something failed", "string error");
      expect(Sentry.captureMessage).toHaveBeenCalledWith("Something failed", { level: "error" });
    });

    it("sets businessId tag when provided", () => {
      const error = new Error("test");
      reportError("Failed", error, { businessId: "biz_123" });
      expect(Sentry.withScope).toHaveBeenCalled();
    });

    it("sets extras when provided", () => {
      const error = new Error("test");
      reportError("Failed", error, { extra: { foo: "bar" } });
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe("reportWarning()", () => {
    it("logs to console", () => {
      reportWarning("Watch out");
      expect(console.warn).toHaveBeenCalledWith("Watch out", undefined);
    });

    it("sends warning to Sentry", () => {
      reportWarning("Watch out", { detail: "something" });
      expect(Sentry.captureMessage).toHaveBeenCalledWith("Watch out", { level: "warning" });
    });
  });
});
