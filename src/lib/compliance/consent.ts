import { db } from "@/db";
import { consentRecords, legalDocuments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getCurrentDocVersion(
  docType: string,
): Promise<string> {
  const [doc] = await db
    .select({ version: legalDocuments.version })
    .from(legalDocuments)
    .where(
      and(
        eq(legalDocuments.documentType, docType),
        eq(legalDocuments.isCurrentVersion, true),
      ),
    )
    .limit(1);
  return doc?.version ?? "1.0";
}

export async function recordConsent(params: {
  businessId?: string;
  phoneNumber?: string;
  consentType: string;
  documentVersion?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  const version =
    params.documentVersion ??
    (await getCurrentDocVersion(params.consentType));

  const [record] = await db
    .insert(consentRecords)
    .values({
      businessId: params.businessId,
      phoneNumber: params.phoneNumber,
      consentType: params.consentType,
      documentVersion: version,
      status: "active",
      consentedAt: new Date().toISOString(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    })
    .returning();

  return record;
}

export async function revokeConsent(params: {
  businessId?: string;
  phoneNumber?: string;
  consentType: string;
  method: "sms_stop" | "email_request" | "dashboard" | "verbal" | "admin";
}) {
  const conditions = [
    eq(consentRecords.consentType, params.consentType),
    eq(consentRecords.status, "active"),
  ];

  if (params.businessId) {
    conditions.push(eq(consentRecords.businessId, params.businessId));
  }
  if (params.phoneNumber) {
    conditions.push(eq(consentRecords.phoneNumber, params.phoneNumber));
  }

  await db
    .update(consentRecords)
    .set({
      status: "revoked",
      revokedAt: new Date().toISOString(),
      revokedMethod: params.method,
    })
    .where(and(...conditions));
}

/**
 * Record TCPA-required disclosures for a call.
 * Creates consent records for call_recording and ai_interaction.
 * Fire-and-forget — called at start of every call.
 */
export async function recordCallDisclosures(
  callId: string,
  businessId: string,
  callerPhone: string,
) {
  const now = new Date().toISOString();

  await Promise.all([
    recordConsent({
      businessId,
      phoneNumber: callerPhone,
      consentType: "call_recording",
      documentVersion: "verbal_disclosure",
      metadata: { callId, method: "verbal_disclosure", disclosedAt: now },
    }),
    recordConsent({
      businessId,
      phoneNumber: callerPhone,
      consentType: "ai_interaction",
      documentVersion: "verbal_disclosure",
      metadata: { callId, method: "verbal_disclosure", disclosedAt: now },
    }),
  ]);
}

export async function hasActiveConsent(params: {
  businessId?: string;
  phoneNumber?: string;
  consentType: string;
}): Promise<boolean> {
  const conditions = [
    eq(consentRecords.consentType, params.consentType),
    eq(consentRecords.status, "active"),
  ];

  if (params.businessId) {
    conditions.push(eq(consentRecords.businessId, params.businessId));
  }
  if (params.phoneNumber) {
    conditions.push(eq(consentRecords.phoneNumber, params.phoneNumber));
  }

  const [record] = await db
    .select({ id: consentRecords.id })
    .from(consentRecords)
    .where(and(...conditions))
    .limit(1);

  return !!record;
}
