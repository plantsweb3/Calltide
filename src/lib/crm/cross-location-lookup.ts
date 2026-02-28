import { db } from "@/db";
import { businesses, customers, calls } from "@/db/schema";
import { eq, and, desc, inArray, isNull } from "drizzle-orm";

/**
 * Look up a caller across all locations in an account.
 * Returns cross-location context string for the AI prompt.
 */
export async function getCrossLocationCustomerContext(
  accountId: string,
  callerPhone: string,
): Promise<string | null> {
  if (!callerPhone || !accountId) return null;

  // Get all business IDs for this account
  const locationRows = await db
    .select({ id: businesses.id, locationName: businesses.locationName, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.accountId, accountId));

  if (locationRows.length <= 1) return null; // Only one location, no cross-location context

  const locationIds = locationRows.map((l) => l.id);
  const locationNames = new Map(locationRows.map((l) => [l.id, l.locationName ?? l.name]));

  // Find customer records across all locations
  const customerRows = await db
    .select({
      id: customers.id,
      name: customers.name,
      businessId: customers.businessId,
      totalCalls: customers.totalCalls,
      language: customers.language,
    })
    .from(customers)
    .where(
      and(
        inArray(customers.businessId, locationIds),
        eq(customers.phone, callerPhone),
        isNull(customers.deletedAt),
      ),
    );

  if (customerRows.length === 0) return null;

  // Get recent calls across all locations
  const recentCalls = await db
    .select({
      businessId: calls.businessId,
      summary: calls.summary,
      createdAt: calls.createdAt,
    })
    .from(calls)
    .where(
      and(
        inArray(calls.businessId, locationIds),
        eq(calls.callerPhone, callerPhone),
      ),
    )
    .orderBy(desc(calls.createdAt))
    .limit(5);

  // Build cross-location context
  const parts: string[] = [];
  const name = customerRows.find((c) => c.name)?.name ?? "Unknown";
  const totalCalls = customerRows.reduce((sum, c) => sum + (c.totalCalls ?? 0), 0);
  const locationsContacted = customerRows.map((c) => locationNames.get(c.businessId) ?? "Unknown");

  parts.push(`Name: ${name}`);
  parts.push(`Total calls across all locations: ${totalCalls}`);
  parts.push(`Locations contacted: ${locationsContacted.join(", ")}`);

  if (recentCalls.length > 0) {
    const summaries = recentCalls
      .filter((c) => c.summary)
      .map((c) => `- [${locationNames.get(c.businessId) ?? "?"}] ${c.summary}`)
      .join("\n");
    if (summaries) parts.push(`Recent calls:\n${summaries}`);
  }

  return `[CROSS-LOCATION CUSTOMER: This caller has contacted multiple locations.

${parts.join("\n")}]`;
}
