import { db } from "@/db";
import { subProcessors } from "@/db/schema";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sub-Procesadores — Calltide",
  description: "Lista de sub-procesadores de datos de Calltide",
};

export default async function SubProcessorsEsPage() {
  const processors = await db.select().from(subProcessors).orderBy(subProcessors.name);

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>Calltide</Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#475569" }}>
            <Link href="/es/legal/terms" className="font-medium hover:underline">Términos</Link>
            <Link href="/es/legal/privacy" className="font-medium hover:underline">Privacidad</Link>
            <Link href="/es/legal/dpa" className="font-medium hover:underline">DPA</Link>
            <Link href="/es/legal/sub-processors" className="font-medium hover:underline">Sub-Procesadores</Link>
            <Link href="/legal/sub-processors" className="text-xs hover:underline" style={{ color: "#94A3B8" }}>EN</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1A1D24" }}>Sub-Procesadores</h1>
        <p className="text-sm mb-8" style={{ color: "#475569" }}>
          Los siguientes proveedores de servicios terceros procesan datos en nombre de Calltide.
        </p>

        {processors.length === 0 ? (
          <p style={{ color: "#94A3B8" }}>No se encontraron sub-procesadores. Ejecute el endpoint de semilla de cumplimiento primero.</p>
        ) : (
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
                  <tr key={proc.id} className="border-t" style={{ borderColor: "#E2E8F0" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#1A1D24" }}>{proc.name}</td>
                    <td className="px-4 py-3" style={{ color: "#475569" }}>{proc.purpose}</td>
                    <td className="px-4 py-3" style={{ color: "#475569" }}>
                      {(proc.dataProcessed as string[] ?? []).join(", ")}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#475569" }}>{proc.location}</td>
                    <td className="px-4 py-3">
                      {proc.dpaUrl ? (
                        <a href={proc.dpaUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: "#C59A27" }}>
                          Ver DPA
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs" style={{ color: "#94A3B8" }}>
          Última actualización: {processors[0]?.lastReviewedAt
            ? new Date(processors[0].lastReviewedAt).toLocaleDateString("es", { month: "long", day: "numeric", year: "numeric" })
            : "N/A"
          }
        </p>
      </main>
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
