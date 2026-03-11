import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { legalDocuments, subProcessors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  TOS_EN,
  TOS_ES,
  PRIVACY_EN,
  PRIVACY_ES,
  DPA_EN,
  DPA_ES,
  SUB_PROCESSORS,
} from "@/lib/legal/content";

/**
 * POST /api/compliance/seed
 * Seeds production legal documents and sub-processors.
 * Supersedes any existing v1.0 docs and inserts v2.0.
 */
export async function POST(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    const effectiveDate = "2026-03-03";
    const changeSummary = "Replaced placeholder templates with comprehensive production legal documents";
    const changeSummaryEs = "Plantillas de marcador de posición reemplazadas con documentos legales de producción completos";

    // Supersede old v1.0 documents
    await db
      .update(legalDocuments)
      .set({
        isCurrentVersion: false,
        supersededDate: effectiveDate,
      })
      .where(
        and(
          eq(legalDocuments.version, "1.0"),
          eq(legalDocuments.isCurrentVersion, true),
        ),
      );

    // Insert new v2.0 documents
    const docs = [
      {
        documentType: "tos",
        version: "2.0",
        title: "Terms of Service",
        titleEs: "Términos de Servicio",
        content: TOS_EN,
        contentEs: TOS_ES,
        effectiveDate,
        changeSummary,
        changeSummaryEs,
        isCurrentVersion: true,
      },
      {
        documentType: "privacy_policy",
        version: "2.0",
        title: "Privacy Policy",
        titleEs: "Política de Privacidad",
        content: PRIVACY_EN,
        contentEs: PRIVACY_ES,
        effectiveDate,
        changeSummary,
        changeSummaryEs,
        isCurrentVersion: true,
      },
      {
        documentType: "dpa",
        version: "2.0",
        title: "Data Processing Agreement",
        titleEs: "Acuerdo de Procesamiento de Datos",
        content: DPA_EN,
        contentEs: DPA_ES,
        effectiveDate,
        changeSummary,
        changeSummaryEs,
        isCurrentVersion: true,
      },
    ];

    for (const doc of docs) {
      // Check if v2.0 already exists for this doc type
      const [existing] = await db
        .select({ id: legalDocuments.id })
        .from(legalDocuments)
        .where(
          and(
            eq(legalDocuments.documentType, doc.documentType),
            eq(legalDocuments.version, "2.0"),
          ),
        )
        .limit(1);

      if (existing) {
        // Update existing v2.0 doc
        await db
          .update(legalDocuments)
          .set({
            content: doc.content,
            contentEs: doc.contentEs,
            title: doc.title,
            titleEs: doc.titleEs,
            effectiveDate: doc.effectiveDate,
            changeSummary: doc.changeSummary,
            changeSummaryEs: doc.changeSummaryEs,
            isCurrentVersion: true,
          })
          .where(eq(legalDocuments.id, existing.id));
      } else {
        await db.insert(legalDocuments).values(doc);
      }
    }

    // Seed sub-processors (upsert by name)
    const now = new Date().toISOString();
    for (const proc of SUB_PROCESSORS) {
      await db.insert(subProcessors).values({
        name: proc.name,
        purpose: proc.purpose,
        dataProcessed: [...proc.dataProcessed],
        location: proc.location,
        dpaUrl: proc.dpaUrl,
        lastReviewedAt: now,
      }).onConflictDoNothing();
    }

    return NextResponse.json({ ok: true, documents: docs.length, processors: SUB_PROCESSORS.length });
  } catch (error) {
    reportError("Compliance seed error", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
