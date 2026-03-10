import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { legalMarkdown } from "@/lib/legal-markdown";
import { TOS_ES } from "@/lib/legal/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Términos de Servicio — Capta", description: "Términos de Servicio de Capta" };

export default async function TermsEsPage() {
  let content = TOS_ES;
  let version = "2.0";
  let effectiveDate = "2026-03-03";

  try {
    const [doc] = await db.select().from(legalDocuments)
      .where(and(eq(legalDocuments.documentType, "tos"), eq(legalDocuments.isCurrentVersion, true))).limit(1);
    if (doc) { content = doc.contentEs || doc.content; version = doc.version; effectiveDate = doc.effectiveDate; }
  } catch { /* static fallback */ }

  return (
    <main className="mx-auto max-w-4xl px-4 py-14" style={{ background: "#FBFBFC" }}>
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#1A1D24" }}>Términos de Servicio</h1>
      </div>
      <div className="mb-10 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(197,154,39,0.1)", color: "#B8860B" }}>
          v{version}
        </span>
        <span className="text-sm" style={{ color: "#94A3B8" }}>
          Vigente desde {new Date(effectiveDate).toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })}
        </span>
      </div>
      <article className="legal-prose" dangerouslySetInnerHTML={{ __html: legalMarkdown(content) }} />
    </main>
  );
}
