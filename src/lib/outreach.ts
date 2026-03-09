import { db } from "@/db";
import { outreachLog } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

interface ContactOptions {
  /** If true, bypass the daily contact limit (used for agent handoffs) */
  isHandoff?: boolean;
  handoffId?: string;
}

export async function canContactToday(
  businessId: string,
  opts?: ContactOptions,
): Promise<boolean> {
  // Handoff overrides skip the daily contact gate
  if (opts?.isHandoff) return true;

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
  source: "dunning" | "churn_agent" | "success_agent" | "nudge_agent" | "incident" | "customer_recall",
  channel: "email" | "sms",
) {
  await db.insert(outreachLog).values({
    businessId,
    source,
    channel,
  });
}
