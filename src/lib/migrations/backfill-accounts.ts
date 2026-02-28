import { db } from "@/db";
import { accounts, businesses } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

export async function backfillAccounts(): Promise<{ created: number; skipped: number }> {
  const unlinked = await db
    .select()
    .from(businesses)
    .where(isNull(businesses.accountId));

  let created = 0;
  let skipped = 0;

  for (const biz of unlinked) {
    if (!biz.ownerEmail) {
      skipped++;
      continue;
    }

    const accountId = crypto.randomUUID();

    await db.insert(accounts).values({
      id: accountId,
      ownerName: biz.ownerName,
      ownerEmail: biz.ownerEmail,
      ownerPhone: biz.ownerPhone,
      companyName: biz.name,
      stripeCustomerId: biz.stripeCustomerId,
      stripeSubscriptionId: biz.stripeSubscriptionId,
      stripeSubscriptionStatus: biz.stripeSubscriptionStatus,
      planType: biz.planType ?? "monthly",
      locationCount: 1,
      maxLocations: 10,
    });

    await db
      .update(businesses)
      .set({
        accountId,
        locationName: "Main",
        isPrimaryLocation: true,
        locationOrder: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, biz.id));

    created++;
  }

  return { created, skipped };
}
