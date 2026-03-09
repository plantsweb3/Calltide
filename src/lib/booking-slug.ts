/**
 * Generates a URL-safe booking slug from a business name.
 * Slugs are lowercase, hyphenated, and deduped with a numeric suffix if needed.
 */

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Convert a business name to a URL-safe slug.
 * Examples:
 *   "Joe's Plumbing & Heating" -> "joes-plumbing-heating"
 *   "My Business" -> "my-business"
 */
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "") // remove apostrophes
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric -> hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 60); // cap length
}

/**
 * Generate a unique booking slug for a business.
 * Checks for collisions and appends a suffix if the base slug is taken.
 */
export async function generateBookingSlug(businessName: string): Promise<string> {
  const base = nameToSlug(businessName) || "business";

  // Check if base slug is available
  const [existing] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.bookingSlug, base))
    .limit(1);

  if (!existing) return base;

  // Try suffixes until we find a free one
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    const [taken] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.bookingSlug, candidate))
      .limit(1);
    if (!taken) return candidate;
  }

  // Fallback: append random suffix
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${rand}`;
}
