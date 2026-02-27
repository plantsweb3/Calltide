import { db } from "@/db";
import { outreachLog } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function canContactToday(businessId: string): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [recent] = await db
    .select({ id: outreachLog.id })
    .from(outreachLog)
    .where(
      and(
        eq(outreachLog.businessId, businessId),
        gte(outreachLog.sentAt, todayStart.toISOString()),
      ),
    )
    .limit(1);

  return !recent;
}

export async function logOutreach(
  businessId: string,
  source: "dunning" | "churn_agent" | "success_agent" | "nudge_agent" | "incident",
  channel: "email" | "sms",
) {
  await db.insert(outreachLog).values({
    businessId,
    source,
    channel,
  });
}
