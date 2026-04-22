import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";

interface CityData {
  name: string;
  state: string;
  stateAbbr: string;
  population: string;
  hispanicPct: string;
  contractors: string;
  climate: string;
  highlights: string[];
  blogSlug: string;
  blogSlugEs: string;
}

const CITIES: Record<string, CityData> = {
  "san-antonio": {
    name: "San Antonio",
    state: "Texas",
    stateAbbr: "TX",
    population: "1.5M+",
    hispanicPct: "65%",
    contractors: "8,000+",
    climate: "Extreme summers (105°F+), mild winters, year-round outdoor work",
    highlights: [
      "65% Hispanic population — bilingual receptionist is essential, not optional",
      "Military installations (JBSA) create steady housing turnover and service demand",
      "Extreme summer heat drives HVAC emergencies May through September",
      "Rapid suburban growth in north and northwest creates constant remodel demand",
    ],
    blogSlug: "best-ai-receptionist-contractors-san-antonio",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-san-antonio",
  },
  houston: {
    name: "Houston",
    state: "Texas",
    stateAbbr: "TX",
    population: "7M+",
    hispanicPct: "45%",
    contractors: "60,000+",
    climate: "Hurricane season, extreme humidity, year-round AC demand",
    highlights: [
      "Largest metro in Texas with 60,000+ licensed contractors competing for jobs",
      "Hurricane season creates massive restoration and roofing demand spikes",
      "Sprawling geography means techs spend hours driving — can't answer phones",
      "45% Hispanic population makes bilingual service a competitive advantage",
    ],
    blogSlug: "best-ai-receptionist-contractors-houston",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-houston",
  },
  dallas: {
    name: "Dallas",
    state: "Texas",
    stateAbbr: "TX",
    population: "7.6M+",
    hispanicPct: "40%",
    contractors: "50,000+",
    climate: "Extreme weather swings, ice storms, summer heat",
    highlights: [
      "DFW metroplex is one of the fastest-growing markets in the US",
      "Extreme weather swings from ice storms to 100°F+ create year-round demand",
      "Corporate relocations drive constant residential turnover and remodel work",
      "40% Hispanic population — Spanish-speaking leads go to whoever answers in Spanish",
    ],
    blogSlug: "best-ai-receptionist-contractors-dallas",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-dallas",
  },
  austin: {
    name: "Austin",
    state: "Texas",
    stateAbbr: "TX",
    population: "2.4M+",
    hispanicPct: "33%",
    contractors: "15,000+",
    climate: "Hot summers, mild winters, rapid growth",
    highlights: [
      "Tech-savvy homeowners expect instant responses — voicemail loses jobs",
      "Fastest-growing metro in Texas with explosive new construction",
      "High property values mean high-value remodel and renovation leads",
      "33% Hispanic population, growing rapidly in surrounding suburbs",
    ],
    blogSlug: "best-ai-receptionist-contractors-austin",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-austin",
  },
  "el-paso": {
    name: "El Paso",
    state: "Texas",
    stateAbbr: "TX",
    population: "850K+",
    hispanicPct: "82%",
    contractors: "3,500+",
    climate: "Desert heat, extreme sun exposure, low humidity",
    highlights: [
      "82% Hispanic population — if your receptionist doesn't speak Spanish, you're losing most of your market",
      "Border city dynamics mean bilingual communication is the baseline expectation",
      "Desert climate creates unique HVAC and roofing challenges year-round",
      "Fort Bliss military installation drives steady residential service demand",
    ],
    blogSlug: "best-ai-receptionist-contractors-el-paso",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-el-paso",
  },
  miami: {
    name: "Miami",
    state: "Florida",
    stateAbbr: "FL",
    population: "6.1M+",
    hispanicPct: "70%",
    contractors: "40,000+",
    climate: "Hurricane season, extreme humidity, year-round heat",
    highlights: [
      "70% Hispanic population — Spanish fluency isn't a bonus, it's table stakes",
      "Hurricane season (June-November) creates 5x-10x normal call volume",
      "Snowbird season doubles the population and service demand every winter",
      "High condo/HOA density means large commercial contracts at stake",
    ],
    blogSlug: "best-ai-receptionist-contractors-miami",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-miami",
  },
  "los-angeles": {
    name: "Los Angeles",
    state: "California",
    stateAbbr: "CA",
    population: "13M+",
    hispanicPct: "48%",
    contractors: "47,000+",
    climate: "Year-round outdoor work, fire season, earthquake risk",
    highlights: [
      "Most competitive contractor market in the US — 47,000+ licensed contractors",
      "48% Hispanic population across LA County makes bilingual service critical",
      "High property values ($900K+ median) mean high-value remodel and repair leads",
      "Year-round outdoor work season means no off-season for call volume",
    ],
    blogSlug: "best-ai-receptionist-contractors-los-angeles",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-los-angeles",
  },
  phoenix: {
    name: "Phoenix",
    state: "Arizona",
    stateAbbr: "AZ",
    population: "4.9M+",
    hispanicPct: "35%",
    contractors: "25,000+",
    climate: "Extreme desert heat (115°F+), rapid growth, monsoon season",
    highlights: [
      "Extreme heat creates urgent HVAC demand — AC failures at 115°F are life-threatening",
      "One of the fastest-growing metros in the country with massive new construction",
      "35% Hispanic population, concentrated in key residential service areas",
      "Monsoon season causes water damage, electrical surges, and roofing issues",
    ],
    blogSlug: "best-ai-receptionist-contractors-phoenix",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-phoenix",
  },
  denver: {
    name: "Denver",
    state: "Colorado",
    stateAbbr: "CO",
    population: "2.9M+",
    hispanicPct: "23%",
    contractors: "15,000+",
    climate: "Cold winters, hail season, rapid weather changes",
    highlights: [
      "Hail season drives massive roofing demand — 3x-5x normal call volume",
      "Cold winters create heating emergencies and frozen pipe calls",
      "Rapid population growth fuels renovation and remodeling demand",
      "Growing Hispanic population in metro suburbs needs bilingual service",
    ],
    blogSlug: "best-ai-receptionist-contractors-denver",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-denver",
  },
  chicago: {
    name: "Chicago",
    state: "Illinois",
    stateAbbr: "IL",
    population: "9.5M+",
    hispanicPct: "22%",
    contractors: "35,000+",
    climate: "Brutal winters, hot summers, freeze-thaw cycles",
    highlights: [
      "Brutal winters create constant heating, plumbing, and insulation emergencies",
      "Freeze-thaw cycles cause pipe bursts, foundation issues, and roof damage",
      "22% Hispanic population concentrated in key neighborhoods needs bilingual support",
      "Aging housing stock (100+ year old homes) drives steady renovation demand",
    ],
    blogSlug: "best-ai-receptionist-contractors-chicago",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-chicago",
  },
  atlanta: {
    name: "Atlanta",
    state: "Georgia",
    stateAbbr: "GA",
    population: "6.2M+",
    hispanicPct: "13%",
    contractors: "20,000+",
    climate: "Hot humid summers, mild winters, severe storms",
    highlights: [
      "Fastest-growing metro in the Southeast with explosive new construction",
      "Severe storm season drives restoration, roofing, and tree service demand",
      "Hot humid summers create steady HVAC and pest control demand",
      "Growing Hispanic population in suburbs — bilingual service captures an underserved market",
    ],
    blogSlug: "best-ai-receptionist-contractors-atlanta",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-atlanta",
  },
  "new-york": {
    name: "New York",
    state: "New York",
    stateAbbr: "NY",
    population: "20M+",
    hispanicPct: "29%",
    contractors: "80,000+",
    climate: "Cold winters, hot summers, hurricane risk",
    highlights: [
      "Largest metro in the US — 80,000+ contractors, highest competition in the country",
      "29% Hispanic population across the metro — bilingual service wins business others can't",
      "High cost of living means high service prices — one missed call can cost $1,000+",
      "Extreme seasonality from winter heating emergencies to summer AC and storm damage",
    ],
    blogSlug: "best-ai-receptionist-contractors-new-york",
    blogSlugEs: "mejor-recepcionista-ai-contratistas-new-york",
  },
};

export function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = CITIES[citySlug];
  if (!city) return { title: "Not Found — Capta" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";
  const title = `AI Receptionist & Office Automation for Contractors in ${city.name}, ${city.stateAbbr} — Capta`;
  const description = `${city.hispanicPct} Hispanic population. ${city.contractors} contractors competing. Capta answers every call 24/7, books appointments, sends SMS follow-ups, and automates your office — in English and Spanish. Built for ${city.name} service businesses.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${appUrl}/locations/${citySlug}`,
      type: "website",
    },
    alternates: {
      canonical: `${appUrl}/locations/${citySlug}`,
    },
  };
}

export default async function CityLandingPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = CITIES[citySlug];
  if (!city) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <StaticNav lang="en" langHref="/es" />

      {/* JSON-LD LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: `Capta AI Receptionist & Office Automation — ${city.name}, ${city.stateAbbr}`,
            description: `AI receptionist and office automation for home service contractors in ${city.name}, ${city.stateAbbr}. Answers calls, books appointments, sends SMS follow-ups, and automates your office 24/7 in English and Spanish.`,
            url: `${appUrl}/locations/${citySlug}`,
            provider: {
              "@type": "Organization",
              name: "Capta",
              url: appUrl,
              address: {
                "@type": "PostalAddress",
                addressLocality: "San Antonio",
                addressRegion: "TX",
                addressCountry: "US",
              },
            },
            areaServed: {
              "@type": "City",
              name: city.name,
              containedInPlace: { "@type": "State", name: city.state },
            },
            serviceType: "AI Receptionist & Office Automation",
            availableLanguage: ["English", "Spanish"],
            offers: {
              "@type": "Offer",
              price: "497",
              priceCurrency: "USD",
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
              { "@type": "ListItem", position: 2, name: "Locations", item: `${appUrl}/locations` },
              { "@type": "ListItem", position: 3, name: city.name },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy px-6 sm:px-8 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(212,168,67,0.08),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-amber">{city.name}, {city.stateAbbr}</p>
          <h1 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[48px]">
            Your AI Office Manager in {city.name}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            {city.population} people. {city.contractors} contractors. {city.hispanicPct} Hispanic population.
            If you&apos;re not answering every call, booking appointments, and following up automatically — in English and Spanish — you&apos;re losing jobs.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href={`/setup?utm_source=locations&utm_medium=landing&utm_campaign=${citySlug}`} className="cta-gold cta-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
              Get Capta &rarr;
            </Link>
            <Link href={`/blog/${city.blogSlug}`} className="text-sm font-medium text-slate-400 transition hover:text-white">
              Read the {city.name} guide &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* City Stats */}
      <section className="px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="rounded-xl border border-cream-border bg-white p-6 text-center">
              <p className="text-[32px] font-extrabold text-amber">{city.population}</p>
              <p className="mt-1 text-sm text-charcoal-muted">Metro population</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6 text-center">
              <p className="text-[32px] font-extrabold text-amber">{city.contractors}</p>
              <p className="mt-1 text-sm text-charcoal-muted">Licensed contractors</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6 text-center">
              <p className="text-[32px] font-extrabold text-amber">{city.hispanicPct}</p>
              <p className="mt-1 text-sm text-charcoal-muted">Hispanic population</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6 text-center">
              <p className="text-[32px] font-extrabold text-amber">24/7</p>
              <p className="mt-1 text-sm text-charcoal-muted">Capta coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This City Needs Capta */}
      <section className="bg-[#F5F5F7] px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">
            Why {city.name} Contractors Need AI-Powered Automation
          </h2>
          <div className="mt-12 space-y-4">
            {city.highlights.map((point, i) => (
              <div key={i} className="rounded-xl border border-cream-border bg-white p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber shrink-0 text-lg font-bold">{i + 1}</span>
                  <p className="text-[15px] leading-relaxed text-charcoal">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Climate Context */}
      <section className="px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-extrabold tracking-tight text-charcoal sm:text-[28px]">
            {city.name} Climate = Year-Round Demand
          </h2>
          <p className="mt-4 text-base leading-relaxed text-charcoal-muted">
            {city.climate}. Weather-driven emergencies don&apos;t call during business hours.
            Capta answers every call — at 2 AM, on weekends, during holidays — in both English and Spanish.
            Then Capta books the appointment, sends the customer an SMS confirmation, and dispatches your on-call tech — all before you wake up.
          </p>
        </div>
      </section>

      {/* Automation Capabilities */}
      <section className="bg-[#F5F5F7] px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">
            More Than a Receptionist — Your AI Office Manager
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-charcoal-muted">
            Answering the phone is just the start. Capta automates the busywork that eats your day so you can focus on jobs.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-cream-border bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-amber">Calls</p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal">Answers every call 24/7 in English and Spanish. Books appointments, takes messages, detects emergencies.</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-amber">SMS Automation</p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal">Sends appointment confirmations, follow-up reminders, and review requests automatically via text — bilingual.</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-amber">Smart Scheduling</p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal">Books, reschedules, and cancels appointments from phone calls and SMS replies. No more phone tag.</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-amber">Emergency Dispatch</p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal">Detects urgent calls and immediately texts your on-call technician with the job details.</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-amber">Lead Scoring</p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal">Automatically scores and ranks every lead so you know which callbacks to prioritize.</p>
            </div>
            <div className="rounded-xl border border-cream-border bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-amber">CRM &amp; Reporting</p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal">Every call, customer, and appointment logged automatically. Revenue attribution shows what Capta earns you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
            {city.name} Contractors: Automate Your Office, Win More Jobs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
            Free for 14 days, then $497/month. Unlimited calls, SMS automation, scheduling, and CRM — bilingual English &amp; Spanish.
          </p>
          <Link href={`/setup?utm_source=locations&utm_medium=landing&utm_campaign=${citySlug}`} className="cta-gold cta-shimmer mt-8 inline-flex items-center gap-2 rounded-lg px-10 py-4 text-lg font-semibold text-white">
            Get Capta &rarr;
          </Link>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link href={`/blog/${city.blogSlug}`} className="text-sm text-slate-400 underline underline-offset-4 transition hover:text-amber">
              Read the full {city.name} guide &rarr;
            </Link>
            <Link href={`/es/blog/${city.blogSlugEs}`} className="text-sm text-slate-400 underline underline-offset-4 transition hover:text-amber">
              Leer la guía de {city.name} en español &rarr;
            </Link>
          </div>
        </div>
      </section>

      <StaticFooter lang="en" />
    </div>
  );
}
