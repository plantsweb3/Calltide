import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TRADE_PROFILES, calculateROI, type TradeType } from "@/lib/receptionist/trade-profiles";
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";

const TRADE_SLUGS: Record<string, TradeType> = {
  plumbing: "plumbing",
  hvac: "hvac",
  electrical: "electrical",
  roofing: "roofing",
  "general-contracting": "general_contractor",
  restoration: "restoration",
  landscaping: "landscaping",
  "pest-control": "pest_control",
  "garage-door": "garage_door",
};

const TRADE_META: Record<string, { h1: string; metaTitle: string; metaDesc: string; blogSlug?: string }> = {
  plumbing: {
    h1: "AI Receptionist for Plumbers",
    metaTitle: "AI Receptionist for Plumbers | Never Miss a Call — Capta",
    metaDesc: "Plumbing emergencies don't wait. Capta answers every call 24/7 in English and Spanish — books appointments, detects emergencies, builds your CRM. $497/mo flat.",
    blogSlug: "ai-receptionist-for-plumbing",
  },
  hvac: {
    h1: "AI Receptionist for HVAC Companies",
    metaTitle: "AI Receptionist for HVAC | 24/7 Bilingual Call Answering — Capta",
    metaDesc: "AC dies at 11 PM? Capta answers. AI receptionist built for HVAC companies — handles after-hours emergencies, seasonal spikes, and Spanish-speaking customers.",
    blogSlug: "ai-receptionist-for-hvac",
  },
  electrical: {
    h1: "AI Receptionist for Electricians",
    metaTitle: "AI Receptionist for Electricians | Answer Every Call — Capta",
    metaDesc: "Electrical emergencies are scary — customers want someone NOW. Capta answers every call 24/7, books appointments, captures high-value remodel leads.",
    blogSlug: "ai-receptionist-for-electricians",
  },
  roofing: {
    h1: "AI Receptionist for Roofers",
    metaTitle: "AI Receptionist for Roofers | Capture Every Storm-Season Lead — Capta",
    metaDesc: "One missed roofing call can cost $10K-$30K. Capta answers 24/7, handles storm-season surges, books inspections, and captures insurance claim callers.",
    blogSlug: "ai-receptionist-for-roofers",
  },
  "general-contracting": {
    h1: "AI Receptionist for General Contractors",
    metaTitle: "AI Receptionist for General Contractors | Never Miss a Lead — Capta",
    metaDesc: "You're on the job site. A homeowner calls about a $50K remodel. Capta answers, qualifies the lead, and books the estimate before your competitor does.",
  },
  restoration: {
    h1: "AI Receptionist for Restoration Companies",
    metaTitle: "AI Receptionist for Water/Fire/Mold Restoration — Capta",
    metaDesc: "In restoration, 80% of calls are emergencies. The company that answers first gets the job. Capta answers every call 24/7 and dispatches immediately.",
  },
  landscaping: {
    h1: "AI Receptionist for Landscapers",
    metaTitle: "AI Receptionist for Landscaping Companies — Capta",
    metaDesc: "Your crew is in the field all day. Capta answers every call, books estimates, handles seasonal spikes, and speaks Spanish — so you never lose a lead.",
    blogSlug: "ai-receptionist-for-landscaping",
  },
  "pest-control": {
    h1: "AI Receptionist for Pest Control",
    metaTitle: "AI Receptionist for Pest Control Companies — Capta",
    metaDesc: "Customers with bed bugs or scorpions want someone NOW. Capta answers every call 24/7, books treatments, and converts first calls into recurring plans.",
  },
  "garage-door": {
    h1: "AI Receptionist for Garage Door Companies",
    metaTitle: "AI Receptionist for Garage Door Repair — Capta",
    metaDesc: "Garage door stuck = car trapped = urgent. Capta answers the call in 2 seconds, books the repair, and sends SMS confirmation. $497/mo flat.",
  },
};

export function generateStaticParams() {
  return Object.keys(TRADE_SLUGS).map((trade) => ({ trade }));
}

export async function generateMetadata({ params }: { params: Promise<{ trade: string }> }): Promise<Metadata> {
  const { trade } = await params;
  const meta = TRADE_META[trade];
  if (!meta) return { title: "Not Found — Capta" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  return {
    title: meta.metaTitle,
    description: meta.metaDesc,
    openGraph: {
      title: meta.metaTitle,
      description: meta.metaDesc,
      url: `${appUrl}/services/${trade}`,
      type: "website",
    },
    alternates: {
      canonical: `${appUrl}/services/${trade}`,
    },
  };
}

export default async function TradeLandingPage({ params }: { params: Promise<{ trade: string }> }) {
  const { trade: tradeSlug } = await params;
  const tradeKey = TRADE_SLUGS[tradeSlug];
  const meta = TRADE_META[tradeSlug];
  if (!tradeKey || !meta) notFound();

  const profile = TRADE_PROFILES[tradeKey];
  const roi = calculateROI(tradeKey, "small");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <StaticNav lang="en" langHref="/es" />

      {/* JSON-LD Service */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: `Capta AI Receptionist for ${profile.label}`,
            description: meta.metaDesc,
            url: `${appUrl}/services/${tradeSlug}`,
            provider: {
              "@type": "Organization",
              name: "Capta",
              url: appUrl,
            },
            serviceType: "AI Receptionist & Office Automation",
            areaServed: { "@type": "Country", name: "US" },
            offers: {
              "@type": "Offer",
              price: "497",
              priceCurrency: "USD",
              priceValidUntil: "2027-12-31",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
              { "@type": "ListItem", position: 2, name: "Services", item: `${appUrl}/services` },
              { "@type": "ListItem", position: 3, name: `AI Receptionist for ${profile.label}` },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy px-6 sm:px-8 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(212,168,67,0.08),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-amber">{profile.label}</p>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]">
            {meta.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            {profile.missedCallRate * 100}% of {profile.label.toLowerCase()} calls go unanswered. Each missed call costs an average of ${profile.avgJobValue.toLocaleString()}. Capta answers every one, books the appointment, sends an SMS confirmation, and follows up — 24/7, in English and Spanish.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href={`/setup?utm_source=services&utm_medium=landing&utm_campaign=${tradeSlug}`} className="cta-gold cta-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
              Get Capta &rarr;
            </Link>
            <Link href="/platform" className="text-sm font-medium text-slate-400 transition hover:text-white">
              See all features &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">
            Why {profile.label} Businesses Need an AI Office Manager
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {profile.painPoints.map((point, i) => (
              <div key={i} className="rounded-xl border border-cream-border bg-white p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber shrink-0 text-lg">&#10003;</span>
                  <p className="text-[15px] leading-relaxed text-charcoal">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Numbers */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-[28px] font-extrabold tracking-tight text-white sm:text-[32px]">
            The Math on Missed {profile.label} Calls
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[36px] font-extrabold text-amber">{roi.missedPerDay}</p>
              <p className="mt-1 text-sm text-slate-400">Missed calls/day</p>
            </div>
            <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[36px] font-extrabold text-amber">${profile.avgJobValue}</p>
              <p className="mt-1 text-sm text-slate-400">Avg job value</p>
            </div>
            <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[36px] font-extrabold text-amber">${roi.estimatedMonthlyLoss.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-400">Lost revenue/mo</p>
            </div>
            <div className="rounded-xl p-6 text-center" style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
              <p className="text-[36px] font-extrabold text-amber">{roi.roiMultiple}x</p>
              <p className="mt-1 text-sm text-slate-300">ROI on Capta</p>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-slate-400">
            {roi.note}
          </p>
        </div>
      </section>

      {/* Services We Understand */}
      {profile.commonServices.length > 0 && (
        <section className="px-6 sm:px-8 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[32px]">
              Capta Knows {profile.label}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-charcoal-muted">
              Capta is trained on {profile.label.toLowerCase()} terminology, services, and pricing. Capta answers calls, books appointments, sends SMS follow-ups, and speaks your customers&apos; language — literally.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profile.commonServices.map((service, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-cream-border bg-white px-5 py-3.5">
                  <span className="text-amber">&#10003;</span>
                  <span className="text-sm font-medium text-charcoal">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Ballparks */}
      {Object.keys(profile.pricingBallparks).length > 0 && (
        <section className="bg-[#F5F5F7] px-6 sm:px-8 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-[24px] font-extrabold tracking-tight text-charcoal sm:text-[28px]">
              Typical {profile.label} Job Values
            </h2>
            <p className="mt-3 text-center text-sm text-charcoal-muted">
              Every missed call is one of these jobs going to your competitor.
            </p>
            <div className="mt-8 space-y-2">
              {Object.entries(profile.pricingBallparks).map(([service, price]) => (
                <div key={service} className="flex items-center justify-between rounded-lg bg-white px-5 py-3 border border-cream-border">
                  <span className="text-sm text-charcoal">{service}</span>
                  <span className="text-sm font-semibold text-charcoal">{price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Automation Beyond the Phone */}
      <section className="px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[32px]">
            Not Just Answering Calls — Automating Your Office
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-charcoal-muted">
            An answering service picks up the phone. An automation consultant charges $5K to set up Zapier. Capta does both — out of the box, for $497/mo.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-cream-border bg-white p-5">
              <span className="mt-0.5 text-amber shrink-0 text-lg">&#10003;</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">SMS Appointment Confirmations</p>
                <p className="mt-1 text-sm text-charcoal-muted">Automatic bilingual text after every booking — no manual follow-up needed</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cream-border bg-white p-5">
              <span className="mt-0.5 text-amber shrink-0 text-lg">&#10003;</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">Review Requests via SMS</p>
                <p className="mt-1 text-sm text-charcoal-muted">Auto-sends review solicitations after completed jobs to build your reputation</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cream-border bg-white p-5">
              <span className="mt-0.5 text-amber shrink-0 text-lg">&#10003;</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">Emergency Technician Dispatch</p>
                <p className="mt-1 text-sm text-charcoal-muted">Detects urgent calls and immediately texts your on-call tech with job details</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cream-border bg-white p-5">
              <span className="mt-0.5 text-amber shrink-0 text-lg">&#10003;</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">Automatic Lead Scoring</p>
                <p className="mt-1 text-sm text-charcoal-muted">Every caller is scored and ranked so you prioritize the highest-value callbacks</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cream-border bg-white p-5">
              <span className="mt-0.5 text-amber shrink-0 text-lg">&#10003;</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">SMS Cancel &amp; Reschedule</p>
                <p className="mt-1 text-sm text-charcoal-muted">Customers text CANCEL or RESCHEDULE to manage their own appointments</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cream-border bg-white p-5">
              <span className="mt-0.5 text-amber shrink-0 text-lg">&#10003;</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">Revenue Attribution &amp; Reporting</p>
                <p className="mt-1 text-sm text-charcoal-muted">See exactly how much revenue Capta generates — cost per lead, ROI, and job breakdown</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal Context */}
      <section className="bg-[#F5F5F7] px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-extrabold tracking-tight text-charcoal sm:text-[28px]">
            Peak Season Automation
          </h2>
          <p className="mt-4 text-base leading-relaxed text-charcoal-muted">
            {profile.seasonalPeak}. During peak season, call volume spikes {profile.tier === 1 ? "2-3x" : "2x"} — that&apos;s when you need Capta most.
            Capta handles unlimited concurrent calls, auto-books appointments, sends confirmation texts, dispatches your crew, and scores every lead — without breaking a sweat.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
            Automate Your {profile.label} Office — Win More Jobs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
            Free for 14 days, then $497/month. Unlimited calls, SMS automation, scheduling, lead scoring, and CRM — bilingual.
          </p>
          <Link href={`/setup?utm_source=services&utm_medium=landing&utm_campaign=${tradeSlug}`} className="cta-gold cta-shimmer mt-8 inline-flex items-center gap-2 rounded-lg px-10 py-4 text-lg font-semibold text-white">
            Get Capta &rarr;
          </Link>
          {meta.blogSlug && (
            <p className="mt-6">
              <Link href={`/blog/${meta.blogSlug}`} className="text-sm text-slate-400 underline underline-offset-4 transition hover:text-amber">
                Read the full {profile.label} guide &rarr;
              </Link>
            </p>
          )}
        </div>
      </section>

      <StaticFooter lang="en" />
    </div>
  );
}
