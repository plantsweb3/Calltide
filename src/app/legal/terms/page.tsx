import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { legalMarkdown } from "@/lib/legal-markdown";
import { TOS_EN } from "@/lib/legal/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service — Calltide",
  description: "Calltide Terms of Service",
};

export default async function TermsPage() {
  let content = TOS_EN;
  let version = "2.0";
  let effectiveDate = "2026-03-03";

  try {
    const [doc] = await db
      .select()
      .from(legalDocuments)
      .where(
        and(
          eq(legalDocuments.documentType, "tos"),
          eq(legalDocuments.isCurrentVersion, true),
        ),
      )
      .limit(1);

    if (doc) {
      content = doc.content;
      version = doc.version;
      effectiveDate = doc.effectiveDate;
    }
  } catch {
    // DB unavailable — use static fallback
  }

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>
            Calltide
          </Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#475569" }}>
            <Link href="/legal/terms" className="font-medium hover:underline">Terms</Link>
            <Link href="/legal/privacy" className="font-medium hover:underline">Privacy</Link>
            <Link href="/legal/dpa" className="font-medium hover:underline">DPA</Link>
            <Link href="/legal/sub-processors" className="font-medium hover:underline">Sub-Processors</Link>
            <Link href="/es/legal/terms" className="text-xs hover:underline" style={{ color: "#94A3B8" }}>ES</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 rounded-lg border p-4" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
          <p className="text-xs" style={{ color: "#94A3B8" }}>
            Version {version} &middot; Effective {new Date(effectiveDate).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <article
          className="prose prose-slate max-w-none"
          style={{ color: "#1A1D24", lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: legalMarkdown(content) }}
        />
      </main>

      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
      </footer>
    </div>
  );
}
