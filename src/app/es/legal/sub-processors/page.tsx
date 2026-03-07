import { db } from "@/db";
import { subProcessors } from "@/db/schema";
import { SUB_PROCESSORS } from "@/lib/legal/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sub-Procesadores — Calltide", description: "Lista de sub-procesadores de datos de Calltide" };

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
    <main className="mx-auto max-w-4xl px-4 py-12" style={{ background: "#FBFBFC" }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#1A1D24" }}>Sub-Procesadores</h1>
      <p className="text-sm mb-8" style={{ color: "#475569" }}>
        Los siguientes proveedores de servicios terceros procesan datos en nombre de Calltide.
      </p>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
        <table className="w-full text-sm" style={{ background: "white" }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Nombre</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Propósito</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Datos Procesados</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>Ubicación</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "#475569" }}>DPA</th>
            </tr>
          </thead>
          <tbody>
            {processors.map((proc) => (
              <tr key={proc.name} className="border-t" style={{ borderColor: "#E2E8F0" }}>
                <td className="px-4 py-3 font-medium" style={{ color: "#1A1D24" }}>{proc.name}</td>
                <td className="px-4 py-3" style={{ color: "#475569" }}>{proc.purpose}</td>
                <td className="px-4 py-3" style={{ color: "#475569" }}>{[...proc.dataProcessed].join(", ")}</td>
                <td className="px-4 py-3" style={{ color: "#475569" }}>{proc.location}</td>
                <td className="px-4 py-3">
                  {proc.dpaUrl ? (
                    <a href={proc.dpaUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: "#C59A27" }}>Ver DPA</a>
                  ) : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs" style={{ color: "#94A3B8" }}>
        Última actualización: {lastReviewed
          ? new Date(lastReviewed).toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })
          : new Date().toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })}
      </p>
    </main>
  );
}
