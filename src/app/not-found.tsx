import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFound() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isSpanish = pathname.startsWith("/es");

  const title = isSpanish ? "Página no encontrada" : "Page not found";
  const desc = isSpanish
    ? "La página que buscas no existe o ha sido movida."
    : "The page you're looking for doesn't exist or has been moved.";
  const homeLabel = isSpanish ? "Ir al Inicio" : "Go to Homepage";
  const helpLabel = isSpanish ? "Centro de Ayuda" : "Help Center";
  const helpHref = isSpanish ? "/es/help" : "/help";

  return (
    <div className="min-h-screen bg-navy grain-overlay flex items-center justify-center px-6">
      <div className="relative z-10 text-center max-w-lg">
        <p className="text-[120px] font-black leading-none tracking-tight text-white/10 sm:text-[180px]">404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          {desc}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white"
          >
            {homeLabel}
          </Link>
          <Link
            href={helpHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            {helpLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
