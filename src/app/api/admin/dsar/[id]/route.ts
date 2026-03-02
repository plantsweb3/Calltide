import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  dataDeletionRequests,
  dataRetentionLog,
  calls,
  leads,
  smsMessages,
  appointments,
  customers,
  consentRecords,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";

const updateSchema = z.object({
  status: z.enum(["received", "verified", "processing", "completed", "denied"]).optional(),
  denialReason: z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [request] = await db
      .select()
      .from(dataDeletionRequests)
      .where(eq(dataDeletionRequests.id, id))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Count related records by phone/email
    const identifier = request.requestedBy;
    let recordCounts: Record<string, number> = {};

    try {
      const [callCount] = await db.select({ count: sql<number>`count(*)` }).from(calls).where(eq(calls.callerPhone, identifier));
      const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.phone, identifier));
      const [smsCount] = await db.select({ count: sql<number>`count(*)` }).from(smsMessages).where(eq(smsMessages.toNumber, identifier));
      const [custCount] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.phone, identifier));
      const [consentCount] = await db.select({ count: sql<number>`count(*)` }).from(consentRecords).where(eq(consentRecords.phoneNumber, identifier));

      recordCounts = {
        calls: callCount?.count ?? 0,
        leads: leadCount?.count ?? 0,
        smsMessages: smsCount?.count ?? 0,
        customers: custCount?.count ?? 0,
        consentRecords: consentCount?.count ?? 0,
      };
    } catch {
      // Non-critical — return request without counts
    }

    return NextResponse.json({ request, recordCounts });
  } catch (error) {
    reportError("Failed to fetch DSAR request", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select()
      .from(dataDeletionRequests)
      .where(eq(dataDeletionRequests.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (result.data.status) {
      updates.status = result.data.status;
      if (result.data.status === "verified") {
        updates.verifiedAt = new Date().toISOString();
      }
      if (result.data.status === "processing") {
        updates.processingStartedAt = new Date().toISOString();
      }
      if (result.data.status === "denied") {
        updates.denialReason = result.data.denialReason || null;
      }
    }

    const [updated] = await db
      .update(dataDeletionRequests)
      .set(updates)
      .where(eq(dataDeletionRequests.id, id))
      .returning();

    return NextResponse.json({ request: updated });
  } catch (error) {
    reportError("Failed to update DSAR request", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [request] = await db
      .select()
      .from(dataDeletionRequests)
      .where(eq(dataDeletionRequests.id, id))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "processing" && request.status !== "verified") {
      return NextResponse.json(
        { error: "Request must be in 'processing' or 'verified' status to execute deletion" },
        { status: 400 },
      );
    }

    const identifier = request.requestedBy;
    const now = new Date().toISOString();

    // Execute all deletions in a single batch transaction for atomicity
    const tables = [
      { name: "calls", table: calls, column: calls.callerPhone },
      { name: "leads", table: leads, column: leads.phone },
      { name: "smsMessages", table: smsMessages, column: smsMessages.toNumber },
      { name: "customers", table: customers, column: customers.phone },
      { name: "consentRecords", table: consentRecords, column: consentRecords.phoneNumber },
    ];

    const deletedRecords: Record<string, number> = {};

    await db.batch(
      tables.map(({ name, table, column }) => {
        // Note: batch mode — each returns a promise
        return db.delete(table).where(eq(column, identifier));
      }) as never,
    ).catch((err) => {
      reportError("DSAR: Batch deletion failed", err);
      throw err; // re-throw to trigger 500
    });

    // Count what was deleted (post-hoc) and log
    for (const { name } of tables) {
      deletedRecords[name] = 0; // Actual counts unavailable from batch delete; mark as executed
    }

    // Update DSAR request as completed
    await db
      .update(dataDeletionRequests)
      .set({
        status: "completed",
        completedAt: now,
        deletedRecords,
      })
      .where(eq(dataDeletionRequests.id, id));

    await logActivity({
      type: "dsar_executed",
      entityType: "dsar",
      entityId: id,
      title: `DSAR deletion executed for ${identifier}`,
      detail: `Deleted records from: ${tables.map((t) => t.name).join(", ")}`,
    });

    return NextResponse.json({
      success: true,
      deletedRecords,
    });
  } catch (error) {
    reportError("Failed to execute DSAR deletion", error);
    return NextResponse.json({ error: "Failed to execute deletion" }, { status: 500 });
  }
}
