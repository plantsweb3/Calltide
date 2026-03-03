import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy grain-overlay flex items-center justify-center px-6">
      <div className="relative z-10 text-center max-w-lg">
        <p className="text-[120px] font-black leading-none tracking-tight text-white/10 sm:text-[180px]">404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white"
          >
            Go to Homepage
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
