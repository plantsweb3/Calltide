import crypto from "crypto";
import { db } from "@/db";
import { customerPortalTokens, customers, businesses } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

/** Hash a portal token for at-rest storage / lookup. */
export function hashPortalToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function validatePortalToken(token: string) {
  const now = new Date().toISOString();
  const tokenHash = hashPortalToken(token);

  const [tokenRecord] = await db
    .select()
    .from(customerPortalTokens)
    .where(
      and(
        eq(customerPortalTokens.token, tokenHash),
        gt(customerPortalTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRecord) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, tokenRecord.customerId))
    .limit(1);

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, tokenRecord.businessId))
    .limit(1);

  if (!customer || !business) return null;

  return { customer, business, tokenRecord };
}
