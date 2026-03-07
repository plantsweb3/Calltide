import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { legalMarkdown } from "@/lib/legal-markdown";
import { DPA_ES } from "@/lib/legal/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acuerdo de Procesamiento de Datos — Calltide", description: "Acuerdo de Procesamiento de Datos de Calltide" };

export default async function DpaEsPage() {
  let content = DPA_ES;
  let version = "2.0";
  let effectiveDate = "2026-03-03";

  try {
    const [doc] = await db.select().from(legalDocuments)
      .where(and(eq(legalDocuments.documentType, "dpa"), eq(legalDocuments.isCurrentVersion, true))).limit(1);
    if (doc) { content = doc.contentEs || doc.content; version = doc.version; effectiveDate = doc.effectiveDate; }
  } catch { /* static fallback */ }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12" style={{ background: "#FBFBFC" }}>
      <div className="mb-8 rounded-lg border p-4" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
        <p className="text-xs" style={{ color: "#94A3B8" }}>
          Versión {version} &middot; Vigente desde {new Date(effectiveDate).toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
      <article className="prose prose-slate max-w-none" style={{ color: "#1A1D24", lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: legalMarkdown(content) }} />
    </main>
  );
}
