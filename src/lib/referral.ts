import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a referral code from a business name.
 * Format: slug(first 10 chars) + "-" + random 4 uppercase alphanumeric
 * Example: "josesplumb-X7K2"
 */
export function generateReferralCode(businessName: string): string {
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${slug}-${suffix}`;
}

/**
 * Generate and persist a referral code for a business.
 * Returns the new referral code.
 */
export async function assignReferralCode(
  businessId: string,
  businessName: string,
): Promise<string> {
  const code = generateReferralCode(businessName);

  await db
    .update(businesses)
    .set({
      referralCode: code,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, businessId));

  return code;
}
