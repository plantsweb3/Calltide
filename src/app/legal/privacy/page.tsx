import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy Policy — Calltide" };

export default async function PrivacyPage() {
  const [doc] = await db
    .select()
    .from(legalDocuments)
    .where(and(eq(legalDocuments.documentType, "privacy_policy"), eq(legalDocuments.isCurrentVersion, true)))
    .limit(1);

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>Calltide</Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#475569" }}>
            <Link href="/legal/terms" className="font-medium hover:underline">Terms</Link>
            <Link href="/legal/privacy" className="font-medium hover:underline">Privacy</Link>
            <Link href="/legal/dpa" className="font-medium hover:underline">DPA</Link>
            <Link href="/legal/sub-processors" className="font-medium hover:underline">Sub-Processors</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">
        {doc ? (
          <>
            <div className="mb-8 rounded-lg border p-4" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Version {doc.version} &middot; Effective {new Date(doc.effectiveDate).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <article className="prose prose-slate max-w-none" style={{ color: "#1A1D24", lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: simpleMarkdown(doc.content) }} />
          </>
        ) : (
          <p style={{ color: "#94A3B8" }}>Document not found. Run the compliance seed endpoint first.</p>
        )}
      </main>
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
      </footer>
    </div>
  );
}

function simpleMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.1rem;font-weight:600;margin:24px 0 8px;color:#1A1D24;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.25rem;font-weight:600;margin:32px 0 12px;color:#1A1D24;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.75rem;font-weight:700;margin:0 0 16px;color:#1A1D24;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n- /g, "<br>• ")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}
