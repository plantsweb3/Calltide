/**
 * Database mock helper for tests.
 *
 * Mocks the @/db module so tests don't need a real database connection.
 * Individual tests should configure mock return values via vi.mocked().
 */
import { vi } from "vitest";

// Create chainable query builder mock
function createChainMock(returnValue: unknown = []) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    "select",
    "from",
    "where",
    "limit",
    "orderBy",
    "offset",
    "innerJoin",
    "leftJoin",
    "returning",
    "set",
    "values",
    "onConflictDoNothing",
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnThis();
  }

  // Terminal methods that return the result
  chain.limit = vi.fn().mockResolvedValue(returnValue);
  chain.returning = vi.fn().mockResolvedValue(returnValue);
  chain.execute = vi.fn().mockResolvedValue(returnValue);

  // Make the chain itself thenable (for queries without terminal .limit/.returning)
  const handler: ProxyHandler<typeof chain> = {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve(returnValue);
      }
      return target[prop as string] ?? vi.fn().mockReturnThis();
    },
  };

  return new Proxy(chain, handler);
}

export function createMockDb() {
  return {
    select: vi.fn(() => createChainMock()),
    insert: vi.fn(() => createChainMock()),
    update: vi.fn(() => createChainMock()),
    delete: vi.fn(() => createChainMock()),
  };
}

/**
 * Call this to set up the @/db mock before tests.
 * Returns the mock db so you can configure return values.
 *
 * Usage:
 *   const mockDb = createMockDb();
 *   vi.mock("@/db", () => ({ db: mockDb }));
 */
export { createChainMock };
