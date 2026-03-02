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
  const result = await db.insert(notifications).values({
    ...params,
    acknowledged: false,
  });

  // Forward critical/emergency notifications to owner via SMS
  if (params.severity === "critical" || params.severity === "emergency") {
    forwardToOwnerSms(params.severity, params.title, params.message).catch(() => {});
  }

  return result;
}

/** Send an SMS to OWNER_PHONE for critical/emergency alerts */
async function forwardToOwnerSms(severity: string, title: string, message: string) {
  const ownerPhone = process.env.OWNER_PHONE;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (!ownerPhone || !twilioSid || !twilioToken || !twilioFrom) return;

  const twilio = (await import("twilio")).default;
  const client = twilio(twilioSid, twilioToken);
  const body = `[${severity.toUpperCase()}] ${title}\n${message}`.slice(0, 1500);

  await client.messages.create({ to: ownerPhone, from: twilioFrom, body });
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
