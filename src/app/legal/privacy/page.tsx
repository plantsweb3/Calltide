import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { legalMarkdown } from "@/lib/legal-markdown";
import { PRIVACY_EN } from "@/lib/legal/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy Policy — Capta", description: "Capta Privacy Policy" };

export default async function PrivacyPage() {
  let content = PRIVACY_EN;
  let version = "2.0";
  let effectiveDate = "2026-03-03";

  try {
    const [doc] = await db
      .select()
      .from(legalDocuments)
      .where(and(eq(legalDocuments.documentType, "privacy_policy"), eq(legalDocuments.isCurrentVersion, true)))
      .limit(1);
    if (doc) { content = doc.content; version = doc.version; effectiveDate = doc.effectiveDate; }
  } catch { /* static fallback */ }

  return (
    <main className="mx-auto max-w-4xl px-4 py-14" style={{ background: "#F8FAFC" }}>
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#0F1729" }}>Privacy Policy</h1>
      </div>
      <div className="mb-10 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(197,154,39,0.1)", color: "#A17D1F" }}>
          v{version}
        </span>
        <span className="text-sm" style={{ color: "#64748B" }}>
          Effective {new Date(effectiveDate).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
        </span>
      </div>
      <article className="legal-prose" dangerouslySetInnerHTML={{ __html: legalMarkdown(content) }} />
    </main>
  );
}
