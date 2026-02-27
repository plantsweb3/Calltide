"use client";

import Link from "next/link";

interface AuditCTAProps {
  variant: "inline" | "full";
  lang: "en" | "es";
  postSlug?: string;
  postId?: string;
}

const copy = {
  en: {
    inline: {
      text: "Is your business missing calls? Find out for free",
      cta: "Get Your Free Audit",
    },
    full: {
      title: "Find Out If You're Missing Calls",
      subtitle: "We'll call your business and send you a free report showing what your customers experience.",
      cta: "Get Your Free Audit",
    },
  },
  es: {
    inline: {
      text: "¿Su negocio está perdiendo llamadas? Descúbralo gratis",
      cta: "Obtener Auditoría Gratis",
    },
    full: {
      title: "Descubra Si Está Perdiendo Llamadas",
      subtitle: "Llamaremos a su negocio y le enviaremos un reporte gratuito mostrando lo que experimentan sus clientes.",
      cta: "Obtener Auditoría Gratis",
    },
  },
};

function trackClick(postId?: string) {
  if (!postId) return;
  fetch(`/api/blog/posts/${postId}/track-cta`, { method: "POST" }).catch(() => {});
}

export default function AuditCTA({ variant, lang, postSlug, postId }: AuditCTAProps) {
  const t = copy[lang] ?? copy.en;
  const utm = postSlug ? `?utm_source=blog&utm_medium=cta&utm_campaign=${postSlug}` : "?utm_source=blog&utm_medium=cta";

  if (variant === "inline") {
    return (
      <div className="rounded-xl bg-amber/5 border border-amber/20 p-5 my-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm font-semibold text-charcoal">{t.inline.text}</p>
          <Link
            href={`/audit${utm}`}
            onClick={() => trackClick(postId)}
            className="cta-gold cta-shimmer shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold text-white text-center"
          >
            {t.inline.cta} &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="rounded-xl bg-navy p-8 sm:p-12 text-center dark-section grain-overlay relative overflow-hidden">
      <div className="relative z-10">
        <h2 className="text-[24px] font-extrabold tracking-tight text-white sm:text-[32px]">
          {t.full.title}
        </h2>
        <p className="mt-3 text-base text-slate-300 leading-relaxed max-w-lg mx-auto">
          {t.full.subtitle}
        </p>
        <Link
          href={`/audit${utm}`}
          onClick={() => trackClick(postId)}
          className="cta-gold cta-shimmer mt-8 inline-block rounded-lg px-8 py-4 text-lg font-semibold text-white"
        >
          {t.full.cta} &rarr;
        </Link>
      </div>
    </div>
  );
}
