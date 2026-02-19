import { db } from "@/db";
import { activityLog } from "@/db/schema";

interface LogActivityParams {
  type: string;
  entityType?: string;
  entityId?: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  await db.insert(activityLog).values({
    type: params.type,
    entityType: params.entityType,
    entityId: params.entityId,
    title: params.title,
    detail: params.detail,
    metadata: params.metadata,
  });
}

// Convenience wrappers
export const logProspectScraped = (prospectId: string, businessName: string, city: string) =>
  logActivity({
    type: "prospect_scraped",
    entityType: "prospect",
    entityId: prospectId,
    title: `Scraped: ${businessName}`,
    detail: `City: ${city}`,
  });

export const logDemoBooked = (demoId: string, prospectName: string) =>
  logActivity({
    type: "demo_booked",
    entityType: "demo",
    entityId: demoId,
    title: `Demo booked: ${prospectName}`,
  });

export const logStatusChange = (
  entityType: string,
  entityId: string,
  from: string,
  to: string,
) =>
  logActivity({
    type: "status_change",
    entityType,
    entityId,
    title: `Status: ${from} → ${to}`,
  });
