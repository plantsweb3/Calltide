/**
 * Seeds KB categories and generates the first batch of help articles.
 * Run: npx tsx scripts/seed-and-generate-kb.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, count } from "drizzle-orm";
import * as schema from "../src/db/schema";
import Anthropic from "@anthropic-ai/sdk";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const db = drizzle(client, { schema });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";

// ── Categories ──

const SEED_CATEGORIES = [
  { slug: "getting-started", name: "Getting Started", nameEs: "Primeros Pasos", description: "Set up your account and get Maria answering calls", descriptionEs: "Configura tu cuenta y pon a María a contestar llamadas", icon: "🚀", sortOrder: 1 },
  { slug: "managing-calls", name: "Managing Calls", nameEs: "Administrar Llamadas", description: "Understand how Maria handles your calls day to day", descriptionEs: "Entiende cómo María maneja tus llamadas día a día", icon: "📞", sortOrder: 2 },
  { slug: "billing-account", name: "Billing & Account", nameEs: "Facturación y Cuenta", description: "Payments, invoices, and subscription management", descriptionEs: "Pagos, facturas y gestión de suscripción", icon: "💳", sortOrder: 3 },
  { slug: "troubleshooting", name: "Troubleshooting", nameEs: "Solución de Problemas", description: "Fix common issues and get back on track", descriptionEs: "Resuelve problemas comunes y vuelve a la normalidad", icon: "🔧", sortOrder: 4 },
  { slug: "features-tips", name: "Features & Tips", nameEs: "Funciones y Consejos", description: "Get the most out of Calltide and Maria", descriptionEs: "Aprovecha al máximo Calltide y María", icon: "⭐", sortOrder: 5 },
  { slug: "for-prospects", name: "Learn About AI Receptionists", nameEs: "Aprende Sobre Recepcionistas AI", description: "Understand how AI receptionists can help your business", descriptionEs: "Entiende cómo una recepcionista AI puede ayudar a tu negocio", icon: "💡", sortOrder: 6 },
];

// ── Article Plan ──

interface ArticlePlan {
  title: string;
  titleEs: string;
  categorySlug: string;
  keyPoints: string;
  audience: string;
  slug: string;
  dashboardContextRoutes?: string[];
  sortOrder: number;
}

const ARTICLE_PLAN: ArticlePlan[] = [
  // Getting Started (6 articles)
  { title: "Welcome to Calltide — Your First Steps", titleEs: "Bienvenido a Calltide — Tus Primeros Pasos", categorySlug: "getting-started", keyPoints: "Account activation, first login, dashboard overview, what to expect in the first week", audience: "existing_clients", slug: "welcome-first-steps", dashboardContextRoutes: ["/dashboard"], sortOrder: 1 },
  { title: "How Maria Handles Your Calls", titleEs: "Cómo María Maneja Tus Llamadas", categorySlug: "getting-started", keyPoints: "Call flow, greeting, language detection, appointment booking, SMS confirmations, after-hours handling", audience: "existing_clients", slug: "how-maria-handles-calls", dashboardContextRoutes: ["/dashboard", "/dashboard/calls"], sortOrder: 2 },
  { title: "Setting Up Your Business Hours", titleEs: "Configurar Tu Horario de Negocio", categorySlug: "getting-started", keyPoints: "How to set business hours, what happens during vs after hours, timezone settings", audience: "existing_clients", slug: "update-business-hours", dashboardContextRoutes: ["/dashboard/settings"], sortOrder: 3 },
  { title: "Customizing Your Services List", titleEs: "Personalizar Tu Lista de Servicios", categorySlug: "getting-started", keyPoints: "How to add/edit services Maria offers to callers, service-based appointment routing", audience: "existing_clients", slug: "customize-services", dashboardContextRoutes: ["/dashboard/settings"], sortOrder: 4 },
  { title: "Understanding Your Dashboard", titleEs: "Entender Tu Panel de Control", categorySlug: "getting-started", keyPoints: "Overview page metrics, call stats, recent activity, what each number means", audience: "existing_clients", slug: "understanding-dashboard", dashboardContextRoutes: ["/dashboard"], sortOrder: 5 },
  { title: "Language Settings — English and Spanish", titleEs: "Configuración de Idioma — Inglés y Español", categorySlug: "getting-started", keyPoints: "How Maria detects language, setting default language, bilingual call handling", audience: "existing_clients", slug: "language-settings", dashboardContextRoutes: ["/dashboard/settings"], sortOrder: 6 },

  // Managing Calls (6 articles)
  { title: "Understanding Your Call Logs", titleEs: "Entender Tu Registro de Llamadas", categorySlug: "managing-calls", keyPoints: "Call list, status meanings (completed/missed/failed), duration, sentiment, transcripts", audience: "existing_clients", slug: "understanding-call-logs", dashboardContextRoutes: ["/dashboard/calls"], sortOrder: 1 },
  { title: "When Calls Get Transferred to You", titleEs: "Cuándo las Llamadas Se Transfieren a Ti", categorySlug: "managing-calls", keyPoints: "Transfer triggers, what the caller hears, how to prepare, transfer vs voicemail", audience: "existing_clients", slug: "when-calls-transfer", dashboardContextRoutes: ["/dashboard/calls"], sortOrder: 2 },
  { title: "How Appointments Are Booked and Tracked", titleEs: "Cómo Se Reservan y Rastrean las Citas", categorySlug: "managing-calls", keyPoints: "Booking flow, SMS confirmations, viewing appointments, cancellations, no-shows", audience: "existing_clients", slug: "appointments-booked-tracked", dashboardContextRoutes: ["/dashboard/appointments"], sortOrder: 3 },
  { title: "Viewing Your SMS Messages", titleEs: "Ver Tus Mensajes SMS", categorySlug: "managing-calls", keyPoints: "SMS log, inbound vs outbound, template types, message history", audience: "existing_clients", slug: "viewing-messages", dashboardContextRoutes: ["/dashboard/sms"], sortOrder: 4 },
  { title: "Reading Call Transcripts and Summaries", titleEs: "Leer Transcripciones y Resúmenes de Llamadas", categorySlug: "managing-calls", keyPoints: "Where to find transcripts, AI summaries, sentiment analysis, using transcripts for quality", audience: "existing_clients", slug: "reading-transcripts", dashboardContextRoutes: ["/dashboard/calls"], sortOrder: 5 },
  { title: "Your Monthly Performance Report", titleEs: "Tu Reporte Mensual de Rendimiento", categorySlug: "managing-calls", keyPoints: "What's in the report, call volume trends, appointment conversion, how to use the data", audience: "existing_clients", slug: "monthly-report", dashboardContextRoutes: ["/dashboard"], sortOrder: 6 },

  // Billing & Account (5 articles)
  { title: "Understanding Your Subscription", titleEs: "Entender Tu Suscripción", categorySlug: "billing-account", keyPoints: "Plan details, $497/month, what's included, billing cycle", audience: "existing_clients", slug: "understanding-subscription", sortOrder: 1 },
  { title: "Billing and Charges Explained", titleEs: "Facturación y Cargos Explicados", categorySlug: "billing-account", keyPoints: "Monthly charge breakdown, when you're billed, payment methods", audience: "existing_clients", slug: "billing-and-charges", sortOrder: 2 },
  { title: "Updating Your Payment Method", titleEs: "Actualizar Tu Método de Pago", categorySlug: "billing-account", keyPoints: "How to update card on file, what happens if payment fails", audience: "existing_clients", slug: "update-payment-method", dashboardContextRoutes: ["/dashboard/settings"], sortOrder: 3 },
  { title: "The Referral Program — Earn Free Months", titleEs: "El Programa de Referidos — Gana Meses Gratis", categorySlug: "billing-account", keyPoints: "How it works, $497 credit per referral, sharing your code, tracking referrals", audience: "existing_clients", slug: "referral-program", dashboardContextRoutes: ["/dashboard/referrals"], sortOrder: 4 },
  { title: "Using Your Referral Code", titleEs: "Usar Tu Código de Referido", categorySlug: "billing-account", keyPoints: "Where to find your code, how to share, what the referred business gets", audience: "existing_clients", slug: "using-referral-code", dashboardContextRoutes: ["/dashboard/referrals"], sortOrder: 5 },

  // Troubleshooting (5 articles)
  { title: "Maria Isn't Answering My Calls", titleEs: "María No Está Contestando Mis Llamadas", categorySlug: "troubleshooting", keyPoints: "Common causes: number forwarding, Twilio config, business hours, how to check and fix", audience: "existing_clients", slug: "maria-not-answering", sortOrder: 1 },
  { title: "I'm Not Receiving SMS Notifications", titleEs: "No Estoy Recibiendo Notificaciones SMS", categorySlug: "troubleshooting", keyPoints: "Check opt-out status, phone number format, SMS log, carrier blocking", audience: "existing_clients", slug: "not-receiving-notifications", dashboardContextRoutes: ["/dashboard/sms"], sortOrder: 2 },
  { title: "Callers Are Hearing the Wrong Greeting", titleEs: "Los Que Llaman Escuchan el Saludo Incorrecto", categorySlug: "troubleshooting", keyPoints: "Custom greeting settings, default vs custom, language mismatch, how to update", audience: "existing_clients", slug: "wrong-greeting", sortOrder: 3 },
  { title: "Appointments Not Showing in Dashboard", titleEs: "Las Citas No Aparecen en el Panel", categorySlug: "troubleshooting", keyPoints: "Sync timing, status filters, timezone issues, when to contact support", audience: "existing_clients", slug: "appointments-not-showing", dashboardContextRoutes: ["/dashboard/appointments"], sortOrder: 4 },
  { title: "I Can't Log Into My Dashboard", titleEs: "No Puedo Entrar a Mi Panel", categorySlug: "troubleshooting", keyPoints: "Magic link login, check spam folder, link expiration, browser issues, contact support", audience: "existing_clients", slug: "cant-login", sortOrder: 5 },

  // Features & Tips (5 articles)
  { title: "Getting the Most Out of Maria", titleEs: "Aprovechando al Máximo a María", categorySlug: "features-tips", keyPoints: "Pro tips for optimizing AI call handling, services list, greeting, hours", audience: "existing_clients", slug: "getting-most-from-maria", sortOrder: 1 },
  { title: "How After-Hours Calls Are Handled", titleEs: "Cómo Se Manejan las Llamadas Fuera de Horario", categorySlug: "features-tips", keyPoints: "After-hours flow, emergency handling, next-day follow-up", audience: "existing_clients", slug: "after-hours-calls", sortOrder: 2 },
  { title: "SMS Appointment Reminders", titleEs: "Recordatorios de Citas por SMS", categorySlug: "features-tips", keyPoints: "Automatic reminders, timing, what they say, opt-out", audience: "existing_clients", slug: "sms-reminders", sortOrder: 3 },
  { title: "Understanding Call Sentiment Analysis", titleEs: "Entender el Análisis de Sentimiento de Llamadas", categorySlug: "features-tips", keyPoints: "What positive/neutral/negative means, how it's calculated, using it to improve", audience: "existing_clients", slug: "sentiment-analysis", dashboardContextRoutes: ["/dashboard/calls"], sortOrder: 4 },
  { title: "Dark Mode and Theme Settings", titleEs: "Modo Oscuro y Configuración de Tema", categorySlug: "features-tips", keyPoints: "Toggle dark/light mode, where to find the setting", audience: "existing_clients", slug: "dark-mode", dashboardContextRoutes: ["/dashboard/settings"], sortOrder: 5 },

  // For Prospects (5 articles)
  { title: "What Is an AI Receptionist?", titleEs: "¿Qué Es una Recepcionista AI?", categorySlug: "for-prospects", keyPoints: "Basic explanation, how it works, difference from voicemail, difference from call center", audience: "prospects", slug: "what-is-ai-receptionist", sortOrder: 1 },
  { title: "How Calltide Helps Home Service Businesses", titleEs: "Cómo Calltide Ayuda a Negocios de Servicios del Hogar", categorySlug: "for-prospects", keyPoints: "Missed call problem, revenue impact, 24/7 coverage, bilingual support, ROI", audience: "prospects", slug: "how-calltide-helps", sortOrder: 2 },
  { title: "The True Cost of Missed Calls", titleEs: "El Verdadero Costo de las Llamadas Perdidas", categorySlug: "for-prospects", keyPoints: "Statistics, revenue lost per missed call, after-hours calls, competitor effect", audience: "prospects", slug: "cost-of-missed-calls", sortOrder: 3 },
  { title: "Why Bilingual Matters for Texas Contractors", titleEs: "Por Qué el Bilingüismo Importa para Contratistas en Texas", categorySlug: "for-prospects", keyPoints: "Hispanic market size in Texas, language as competitive advantage, Maria speaks both", audience: "prospects", slug: "why-bilingual-matters", sortOrder: 4 },
  { title: "Getting Started with Your Free Phone Audit", titleEs: "Comenzar con Tu Auditoría Telefónica Gratis", categorySlug: "for-prospects", keyPoints: "What the audit tests, how it works, what you'll learn, next steps", audience: "prospects", slug: "free-phone-audit", sortOrder: 5 },
];

const ARTICLE_SYSTEM_PROMPT = `You are a bilingual help center content writer for Calltide, a bilingual AI receptionist service for Hispanic home service businesses in Texas.

Company context:
- Calltide provides an AI receptionist named Maria that answers calls in English and Spanish 24/7
- Service costs $497/month
- Target audience: plumbers, HVAC techs, electricians, landscapers, and other home service businesses
- Maria books appointments, sends SMS confirmations, and handles after-hours calls
- Clients access a dashboard to view calls, appointments, SMS logs, and referrals

Write a help center article in BOTH English and Spanish. The article should be:
- Clear, concise, and helpful
- Written at a 6th-grade reading level
- Include step-by-step instructions where applicable
- Use markdown formatting (headings, lists, bold for emphasis)
- 400-800 words per language
- Practical and actionable

Return a JSON object with these exact fields:
{
  "title": "English title",
  "titleEs": "Spanish title",
  "excerpt": "One-sentence English summary (under 150 chars)",
  "excerptEs": "One-sentence Spanish summary (under 150 chars)",
  "content": "Full English markdown content",
  "contentEs": "Full Spanish markdown content",
  "metaTitle": "SEO title (English, max 60 chars)",
  "metaTitleEs": "SEO title (Spanish, max 60 chars)",
  "metaDescription": "SEO description (English, max 155 chars)",
  "metaDescriptionEs": "SEO description (Spanish, max 155 chars)",
  "searchKeywords": "comma,separated,english,keywords",
  "searchKeywordsEs": "comma,separated,spanish,keywords"
}

Return ONLY valid JSON, no markdown fences, no extra text.`;

// ── Main ──

async function main() {
  console.log("=== Calltide Knowledge Base Seed + Generate ===\n");

  // 1. Run migration
  console.log("1. Checking migration...");
  try {
    await client.execute("SELECT 1 FROM help_categories LIMIT 1");
    console.log("   Tables already exist.");
  } catch {
    console.log("   Running migration...");
    const fs = await import("fs");
    const sql = fs.readFileSync("src/db/migrations/0007_strong_zarda.sql", "utf-8");
    const statements = sql.split(";").map((s: string) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    console.log("   Migration complete.");
  }

  // 2. Seed categories
  console.log("\n2. Seeding categories...");
  const [existing] = await db.select({ c: count() }).from(schema.helpCategories);
  if (existing.c > 0) {
    console.log(`   Already have ${existing.c} categories.`);
  } else {
    await db.insert(schema.helpCategories).values(SEED_CATEGORIES);
    console.log("   Seeded 6 categories.");
  }

  // 3. Get category map
  const cats = await db.select().from(schema.helpCategories);
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));
  console.log(`   Category IDs: ${cats.map((c) => `${c.slug}=${c.id.slice(0, 8)}`).join(", ")}`);

  // 4. Check existing articles
  const [articleCount] = await db.select({ c: count() }).from(schema.helpArticles);
  console.log(`\n3. Existing articles: ${articleCount.c}`);

  // 5. Generate articles
  const existingSlugs = new Set(
    (await db.select({ slug: schema.helpArticles.slug }).from(schema.helpArticles)).map((a) => a.slug),
  );

  const toGenerate = ARTICLE_PLAN.filter((a) => !existingSlugs.has(a.slug));
  console.log(`\n4. Generating ${toGenerate.length} articles...\n`);

  let generated = 0;
  for (const plan of toGenerate) {
    const categoryId = catMap.get(plan.categorySlug);
    if (!categoryId) {
      console.log(`   SKIP: No category for slug "${plan.categorySlug}"`);
      continue;
    }

    console.log(`   [${generated + 1}/${toGenerate.length}] ${plan.title}...`);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: ARTICLE_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              title: plan.title,
              titleEs: plan.titleEs,
              category: plan.categorySlug,
              keyPoints: plan.keyPoints,
              audience: plan.audience,
            }),
          },
        ],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log(`     FAILED: No JSON in response`);
        continue;
      }

      const article = JSON.parse(jsonMatch[0]);
      const wordCount = (article.content || "").split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      await db.insert(schema.helpArticles).values({
        categoryId,
        slug: plan.slug,
        title: article.title || plan.title,
        titleEs: article.titleEs || plan.titleEs,
        excerpt: article.excerpt,
        excerptEs: article.excerptEs,
        content: article.content,
        contentEs: article.contentEs,
        metaTitle: article.metaTitle,
        metaTitleEs: article.metaTitleEs,
        metaDescription: article.metaDescription,
        metaDescriptionEs: article.metaDescriptionEs,
        searchKeywords: article.searchKeywords,
        searchKeywordsEs: article.searchKeywordsEs,
        relatedArticles: [],
        dashboardContextRoutes: plan.dashboardContextRoutes ?? [],
        status: "published",
        publishedAt: new Date().toISOString(),
        readingTimeMinutes: readingTime,
        sortOrder: plan.sortOrder,
      });

      generated++;
      console.log(`     OK (${wordCount} words, ${readingTime} min read)`);
    } catch (err) {
      console.log(`     ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 6. Update category article counts
  console.log("\n5. Updating category article counts...");
  for (const cat of cats) {
    const [result] = await db
      .select({ c: count() })
      .from(schema.helpArticles)
      .where(eq(schema.helpArticles.categoryId, cat.id));
    await db
      .update(schema.helpCategories)
      .set({ articleCount: result.c })
      .where(eq(schema.helpCategories.id, cat.id));
  }

  // 7. Summary
  const [finalCount] = await db.select({ c: count() }).from(schema.helpArticles);
  console.log(`\n=== DONE ===`);
  console.log(`Total articles: ${finalCount.c}`);
  console.log(`Generated this run: ${generated}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
