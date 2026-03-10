import { db } from "@/db";
import { subProcessors } from "@/db/schema";
import { SUB_PROCESSORS } from "@/lib/legal/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sub-Procesadores — Capta", description: "Lista de sub-procesadores de datos de Capta" };

type Processor = {
  name: string;
  purpose: string;
  dataProcessed: readonly string[] | string[];
  location: string;
  dpaUrl: string;
};

export default async function SubProcessorsEsPage() {
  let processors: Processor[] = SUB_PROCESSORS.map((p) => ({ ...p }));
  let lastReviewed: string | null = null;

  try {
    const dbProcessors = await db.select().from(subProcessors).orderBy(subProcessors.name);
    if (dbProcessors.length > 0) {
      processors = dbProcessors.map((p) => ({
        name: p.name, purpose: p.purpose,
        dataProcessed: (p.dataProcessed as string[]) ?? [],
        location: p.location ?? "United States", dpaUrl: p.dpaUrl ?? "",
      }));
      lastReviewed = dbProcessors[0]?.lastReviewedAt ?? null;
    }
  } catch { /* static fallback */ }

  return (
    <main className="mx-auto max-w-4xl px-4 py-14" style={{ background: "#FBFBFC" }}>
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#1A1D24" }}>Sub-Procesadores</h1>
      </div>
      <p className="mb-8 text-sm leading-relaxed" style={{ color: "#64748B" }}>
        Los siguientes proveedores de servicios terceros procesan datos en nombre de Capta como parte de la entrega de nuestra plataforma de recepcionista AI.
      </p>

      <div className="overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "#E2E8F0" }}>
        <table className="w-full text-sm" style={{ background: "white" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Proveedor</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Propósito</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#64748B" }}>Datos Procesados</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#64748B" }}>Ubicación</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>DPA</th>
            </tr>
          </thead>
          <tbody>
            {processors.map((proc) => (
              <tr
                key={proc.name}
                className="border-t transition-colors hover:bg-gray-50/50"
                style={{ borderColor: "#F1F5F9" }}
              >
                <td className="px-5 py-4 font-semibold" style={{ color: "#1A1D24" }}>{proc.name}</td>
                <td className="px-5 py-4" style={{ color: "#64748B" }}>{proc.purpose}</td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {[...proc.dataProcessed].map((d) => (
                      <span key={d} className="rounded-full px-2 py-0.5 text-xs" style={{ background: "#F1F5F9", color: "#64748B" }}>{d}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell" style={{ color: "#64748B" }}>{proc.location}</td>
                <td className="px-5 py-4">
                  {proc.dpaUrl ? (
                    <a href={proc.dpaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold transition hover:brightness-110" style={{ color: "#C59A27" }}>
                      Ver
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  ) : <span style={{ color: "#CBD5E1" }}>&mdash;</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs" style={{ color: "#94A3B8" }}>
        Última revisión: {lastReviewed
          ? new Date(lastReviewed).toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })
          : new Date().toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })}
      </p>
    </main>
  );
}
