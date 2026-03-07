import { db } from "@/db";
import { subProcessors } from "@/db/schema";
import Link from "next/link";
import { SUB_PROCESSORS } from "@/lib/legal/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sub-Processors — Calltide" };

type Processor = {
  name: string;
  purpose: string;
  dataProcessed: readonly string[] | string[];
  location: string;
  dpaUrl: string;
};

export default async function SubProcessorsPage() {
  let processors: Processor[] = SUB_PROCESSORS.map((p) => ({ ...p }));
  let lastReviewed: string | null = null;

  try {
    const dbProcessors = await db.select().from(subProcessors).orderBy(subProcessors.name);
    if (dbProcessors.length > 0) {
      processors = dbProcessors.map((p) => ({
        name: p.name,
        purpose: p.purpose,
        dataProcessed: (p.dataProcessed as string[]) ?? [],
        location: p.location ?? "United States",
        dpaUrl: p.dpaUrl ?? "",
      }));
      lastReviewed = dbProcessors[0]?.lastReviewedAt ?? null;
    }
  } catch {
    // DB unavailable — use static fallback
  }

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
            <Link href="/es/legal/sub-processors" className="text-xs hover:underline" style={{ color: "#94A3B8" }}>ES</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1A1D24" }}>Sub-Processors</h1>
        <p className="text-sm mb-8" style={{ color: "#475569" }}>
          The following third-party service providers process data on behalf of Calltide.
        </p>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
          <table className="w-full text-sm" style={{ background: "white" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Name</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Purpose</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Data Processed</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Location</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>DPA</th>
              </tr>
            </thead>
            <tbody>
              {processors.map((proc) => (
                <tr key={proc.name} className="border-t" style={{ borderColor: "#E2E8F0" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1A1D24" }}>{proc.name}</td>
                  <td className="px-4 py-3" style={{ color: "#475569" }}>{proc.purpose}</td>
                  <td className="px-4 py-3" style={{ color: "#475569" }}>
                    {[...proc.dataProcessed].join(", ")}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#475569" }}>{proc.location}</td>
                  <td className="px-4 py-3">
                    {proc.dpaUrl ? (
                      <a href={proc.dpaUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: "#C59A27" }}>
                        View DPA
                      </a>
                    ) : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs" style={{ color: "#94A3B8" }}>
          Last updated: {lastReviewed
            ? new Date(lastReviewed).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })
            : new Date().toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })
          }
        </p>
      </main>
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
      </footer>
    </div>
  );
}
