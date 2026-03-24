import { db } from "@/db";
import { customerPortalTokens, customers, businesses } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function validatePortalToken(token: string) {
  const now = new Date().toISOString();

  const [tokenRecord] = await db
    .select()
    .from(customerPortalTokens)
    .where(
      and(
        eq(customerPortalTokens.token, token),
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
