import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

type Severity = "info" | "warning" | "critical" | "emergency";
type Source = "capacity" | "incident" | "financial" | "retention" | "compliance" | "agents" | "knowledge";

export async function createNotification(params: {
  source: Source;
  severity: Severity;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  return db.insert(notifications).values({
    ...params,
    acknowledged: false,
  });
}

export async function getUnacknowledgedCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(eq(notifications.acknowledged, false));
  return result?.count ?? 0;
}

export async function getNotifications(opts: {
  limit?: number;
  offset?: number;
  unacknowledgedOnly?: boolean;
  source?: string;
  severity?: string;
}) {
  const conditions = [];
  if (opts.unacknowledgedOnly) conditions.push(eq(notifications.acknowledged, false));
  if (opts.source) conditions.push(eq(notifications.source, opts.source));
  if (opts.severity) conditions.push(eq(notifications.severity, opts.severity));

  return db
    .select()
    .from(notifications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notifications.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

export async function acknowledgeNotification(id: string) {
  return db
    .update(notifications)
    .set({ acknowledged: true, acknowledgedAt: new Date().toISOString() })
    .where(eq(notifications.id, id));
}

export async function acknowledgeAll() {
  return db
    .update(notifications)
    .set({ acknowledged: true, acknowledgedAt: new Date().toISOString() })
    .where(eq(notifications.acknowledged, false));
}
