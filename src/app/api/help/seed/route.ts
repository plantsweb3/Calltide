import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

function verifySeedAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? req.nextUrl.searchParams.get("key") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!token || token.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

/* ────────────────────────────────────────────────────────── */
/*  POST /api/help/seed                                      */
/*  Seeds 6 help categories + 37 articles from vault content  */
/* ────────────────────────────────────────────────────────── */

const SEED_CATEGORIES = [
  { slug: "getting-started", name: "Getting Started", nameEs: "Primeros Pasos", description: "Set up your account and get your receptionist answering calls", descriptionEs: "Configura tu cuenta y pon a tu recepcionista a contestar llamadas", icon: "🚀", sortOrder: 1 },
  { slug: "managing-calls", name: "Managing Calls", nameEs: "Administrar Llamadas", description: "Understand how your receptionist handles your calls day to day", descriptionEs: "Entiende cómo tu recepcionista maneja tus llamadas día a día", icon: "📞", sortOrder: 2 },
  { slug: "billing-account", name: "Billing & Account", nameEs: "Facturación y Cuenta", description: "Payments, invoices, and subscription management", descriptionEs: "Pagos, facturas y gestión de suscripción", icon: "💳", sortOrder: 3 },
  { slug: "troubleshooting", name: "Troubleshooting", nameEs: "Solución de Problemas", description: "Fix common issues and get back on track", descriptionEs: "Resuelve problemas comunes y vuelve a la normalidad", icon: "🔧", sortOrder: 4 },
  { slug: "features-tips", name: "Features & Tips", nameEs: "Funciones y Consejos", description: "Get the most out of Capta's features", descriptionEs: "Aprovecha al máximo las funciones de Capta", icon: "⭐", sortOrder: 5 },
  { slug: "for-prospects", name: "Learn About AI Receptionists", nameEs: "Aprende Sobre Recepcionistas AI", description: "Understand how AI receptionists can help your business", descriptionEs: "Entiende cómo una recepcionista AI puede ayudar a tu negocio", icon: "💡", sortOrder: 6 },
];

interface ArticleSeed {
  slug: string;
  categorySlug: string;
  title: string;
  content: string;
  sortOrder: number;
  searchKeywords: string;
  dashboardContextRoutes?: string[];
  relatedArticles?: string[];
  titleEs?: string;
  contentEs?: string;
  searchKeywordsEs?: string;
}

const ARTICLES: ArticleSeed[] = [
  // ── Getting Started (1 article) ──
  {
    slug: "what-is-capta",
    categorySlug: "getting-started",
    title: "What Is Capta and How Does Your Receptionist Work?",
    sortOrder: 1,
    searchKeywords: "capta, ai receptionist, how it works, setup, getting started, bilingual, scheduling, 24/7",
    dashboardContextRoutes: ["/dashboard"],
    relatedArticles: ["how-maria-handles-calls", "tips-best-results", "first-month-expectations"],
    content: `Capta is an AI-powered receptionist service for home service businesses. Instead of missing calls or paying someone to answer the phone, your AI receptionist handles incoming calls 24/7, even when you're on a job site or helping customers.

## How Your Receptionist Works

She is not a robotic phone menu. She sounds like a real person and has natural conversations with your callers.

### What Your Receptionist Does

- **Answers calls immediately** — No voicemail jail, no waiting on hold
- **Books appointments** — She checks your calendar and schedules jobs directly
- **Sends confirmations** — SMS texts go to customers immediately after booking
- **Detects emergencies** — Urgent calls alert you right away
- **Takes messages** — If you're unavailable, She takes detailed notes
- **Handles both languages** — English and Spanish, automatically

### Your Business Profile Powers Your Receptionist

She learns from the information you provide:
- Your services and pricing
- Your hours of operation
- Your service area
- Common customer questions (FAQs)

The more complete your profile, the better She can handle calls.

## Why Contractors Choose Capta

1. **Never miss a call** — She answers 24/7, even when you're in the field
2. **Automatic scheduling** — Appointments booked and managed in your Capta dashboard
3. **Bilingual** — Spanish and English, no extra cost
4. **Real data** — Call logs, transcripts, and customer info all in one place
5. **Affordable** — $497/month for unlimited calls and features

## Getting Started

1. **Set up your profile** (30 minutes) — Add your services, pricing, and hours
2. **Set your availability** (5 minutes) — Configure your hours and availability so She can book appointments
3. **Forward your phone number** (varies) — Set up call forwarding to Capta
4. **Test your receptionist** (5 minutes) — Call your number and have a test conversation
5. **Go live** — Your receptionist starts answering your real calls

## Get Started

$497/month with a 14-day free trial. See how She handles your calls, manages your schedule, and frees up your time.

Need help? Email support@captahq.com or call (830) 521-7133.`,
    titleEs: "¿Qué es Capta y cómo funciona tu recepcionista?",
    contentEs: `Capta es un servicio de recepcionista con inteligencia artificial para negocios de servicios del hogar. En vez de perder llamadas o pagarle a alguien para contestar el teléfono, tu recepcionista de IA atiende llamadas las 24 horas del día, los 7 días de la semana, incluso cuando estás en el campo o atendiendo clientes.

## Cómo funciona tu recepcionista

No es un menú telefónico robótico. Suena como una persona real y tiene conversaciones naturales con quienes te llaman.

### Qué hace tu recepcionista

- **Contesta llamadas al instante** — Sin buzón de voz, sin esperar en línea
- **Agenda citas** — Revisa tu calendario y programa trabajos directamente
- **Envía confirmaciones** — Mensajes SMS al cliente inmediatamente después de agendar
- **Detecta emergencias** — Las llamadas urgentes te alertan de inmediato
- **Toma mensajes** — Si no estás disponible, toma notas detalladas
- **Maneja ambos idiomas** — Inglés y español, automáticamente

### Tu perfil de negocio alimenta a tu recepcionista

Ella aprende de la información que proporcionas:
- Tus servicios y precios
- Tu horario de operación
- Tu área de servicio
- Preguntas frecuentes de clientes (FAQs)

Entre más completo esté tu perfil, mejor podrá manejar las llamadas.

## Por qué los contratistas eligen Capta

1. **Nunca pierdas una llamada** — Contesta 24/7, incluso cuando estás en el campo
2. **Agendado automático** — Citas reservadas y administradas en tu panel de Capta
3. **Bilingüe** — Español e inglés, sin costo extra
4. **Datos reales** — Registros de llamadas, transcripciones e información de clientes en un solo lugar
5. **Accesible** — $497/mes por llamadas y funciones ilimitadas

## Cómo empezar

1. **Configura tu perfil** (30 minutos) — Agrega tus servicios, precios y horarios
2. **Define tu disponibilidad** (5 minutos) — Configura tus horarios para que ella pueda agendar citas
3. **Redirige tu número de teléfono** (varía) — Configura el desvío de llamadas hacia Capta
4. **Prueba tu recepcionista** (5 minutos) — Llama a tu número y ten una conversación de prueba
5. **Actívala** — Tu recepcionista empieza a contestar tus llamadas reales

## Empieza ya

$497/mes con prueba gratuita de 14 días. Mira cómo maneja tus llamadas, administra tu agenda y te libera tiempo.

¿Necesitas ayuda? Escríbenos a support@captahq.com o llama al (830) 521-7133.`,
    searchKeywordsEs: "capta, recepcionista ia, cómo funciona, configuración, primeros pasos, bilingüe, agendado, 24/7",
  },

  // ── Managing Calls (5 articles) ──
  {
    slug: "how-maria-handles-calls",
    categorySlug: "managing-calls",
    title: "How Your Receptionist Answers Calls",
    sortOrder: 9,
    searchKeywords: "calls, answering, booking, appointments, emergencies, messages, schedule, greeting, action",
    dashboardContextRoutes: ["/dashboard", "/dashboard/calls", "/dashboard/appointments"],
    relatedArticles: ["understanding-call-logs", "appointments-booked-tracked", "when-calls-transfer"],
    content: `When someone calls your business number, here's what your receptionist does:

1. **Answers with your greeting** — Uses the custom greeting you set up so callers know they reached your business
2. **Listens to understand** — She asks clarifying questions to understand what the caller needs
3. **Takes action** — She books the appointment, answers from your business info, or takes a message
4. **Keeps you informed** — You get SMS alerts and email notifications

### What Your Receptionist Can Handle

**Book Appointments**
- Gets caller's name, phone, service needed, and preferred date/time
- Checks your calendar for availability
- Confirms the booking instantly
- Sends SMS confirmation to customer

**Answer Questions**
- About your services, pricing, hours, and availability
- Uses the information you've provided in your business profile

**Escalate Emergencies**
- Recognizes urgent situations (burst pipes, no electricity, etc.)
- Sends you immediate SMS alert
- Can transfer the call to you if needed

**Take Messages**
- Takes detailed information when she's not confident about the answer
- Notifies you immediately via SMS and email`,
    titleEs: "Cómo tu recepcionista contesta las llamadas",
    contentEs: `Cuando alguien llama al número de tu negocio, esto es lo que hace tu recepcionista:

1. **Contesta con tu saludo** — Usa el saludo personalizado que configuraste para que los clientes sepan que llamaron a tu negocio
2. **Escucha para entender** — Hace preguntas para entender lo que necesita la persona que llama
3. **Toma acción** — Agenda la cita, responde con la información de tu negocio, o toma un mensaje
4. **Te mantiene informado** — Recibes alertas por SMS y notificaciones por email

### Qué puede manejar tu recepcionista

**Agendar citas**
- Obtiene nombre, teléfono, servicio necesitado y fecha/hora preferida
- Revisa tu calendario para ver disponibilidad
- Confirma la reservación al instante
- Envía confirmación por SMS al cliente

**Contestar preguntas**
- Sobre tus servicios, precios, horarios y disponibilidad
- Usa la información que proporcionaste en tu perfil de negocio

**Escalar emergencias**
- Reconoce situaciones urgentes (tuberías rotas, sin electricidad, etc.)
- Te envía una alerta SMS inmediata
- Puede transferirte la llamada si es necesario

**Tomar mensajes**
- Toma información detallada cuando no está segura de la respuesta
- Te notifica de inmediato por SMS y email`,
    searchKeywordsEs: "llamadas, contestar, agendar, citas, emergencias, mensajes, horario, saludo, acción",
  },
  {
    slug: "understanding-call-logs",
    categorySlug: "managing-calls",
    title: "Understanding Your Call Logs",
    sortOrder: 10,
    searchKeywords: "call logs, recordings, transcripts, summaries, sentiment, lead score, filter, search, history",
    dashboardContextRoutes: ["/dashboard/calls"],
    relatedArticles: ["how-maria-handles-calls", "monthly-report"],
    content: `Every call is logged in your dashboard with:

- **Date and time** — When the call came in
- **Duration** — How long the call lasted
- **Recording** — Full audio of the call
- **Transcript** — Word-for-word record of what was said
- **AI summary** — Short summary of what happened
- **Sentiment** — Whether the customer was happy, neutral, or upset
- **Lead score** — Likelihood they'll become a customer (1-10)

### Filter and Search Your Calls

- Filter by date range
- Search by phone number
- Filter by sentiment
- Sort by lead score to prioritize follow-ups`,
    titleEs: "Entendiendo tu registro de llamadas",
    contentEs: `Cada llamada se registra en tu panel con:

- **Fecha y hora** — Cuándo entró la llamada
- **Duración** — Cuánto duró la llamada
- **Grabación** — Audio completo de la llamada
- **Transcripción** — Registro palabra por palabra de lo que se dijo
- **Resumen con IA** — Resumen corto de lo que pasó
- **Sentimiento** — Si el cliente estaba contento, neutral o molesto
- **Puntaje de prospecto** — Probabilidad de que se convierta en cliente (1-10)

### Filtra y busca tus llamadas

- Filtra por rango de fechas
- Busca por número de teléfono
- Filtra por sentimiento
- Ordena por puntaje de prospecto para priorizar seguimientos`,
    searchKeywordsEs: "registro de llamadas, grabaciones, transcripciones, resúmenes, sentimiento, puntaje prospecto, filtrar, buscar, historial",
  },
  {
    slug: "appointments-booked-tracked",
    categorySlug: "managing-calls",
    title: "How Appointments Are Booked and Tracked",
    sortOrder: 11,
    searchKeywords: "appointments, booking, calendar, scheduling, reschedule, cancel, no-show, dashboard",
    dashboardContextRoutes: ["/dashboard/appointments"],
    relatedArticles: ["how-maria-handles-calls", "tips-best-results"],
    content: `### your receptionist's Booking Process

Your receptionist gathers the information she needs:
1. Caller's name
2. Caller's phone number
3. Service needed
4. Preferred date and time

She then:
- Checks your availability based on your configured hours
- Books the appointment in your Capta dashboard
- Sends SMS confirmation to the customer
- Notifies you via SMS

### Managing Appointments from Your Dashboard

In the Appointments section, you can:
- View all upcoming appointments by date
- Click any appointment to see full details
- Reschedule or cancel appointments
- Track no-shows

**Pro tip:** Keep your hours and availability updated in your Capta settings so she always has your real availability.`,
    titleEs: "Cómo se agendan y rastrean las citas",
    contentEs: `### Proceso de reservación de tu recepcionista

Tu recepcionista reúne la información que necesita:
1. Nombre de la persona que llama
2. Número de teléfono
3. Servicio que necesita
4. Fecha y hora preferida

Luego ella:
- Revisa tu disponibilidad según tus horarios configurados
- Agenda la cita en tu panel de Capta
- Envía confirmación por SMS al cliente
- Te notifica por SMS

### Administrando citas desde tu panel

En la sección de Citas, puedes:
- Ver todas las citas próximas por fecha
- Hacer clic en cualquier cita para ver los detalles completos
- Reagendar o cancelar citas
- Rastrear ausencias

**Consejo:** Mantén tus horarios y disponibilidad actualizados en tu configuración de Capta para que ella siempre tenga tu disponibilidad real.`,
    searchKeywordsEs: "citas, reservación, calendario, agendado, reagendar, cancelar, ausencia, panel",
  },
  {
    slug: "viewing-messages",
    categorySlug: "managing-calls",
    title: "Viewing Messages Your Receptionist Took",
    sortOrder: 12,
    searchKeywords: "messages, notifications, sms, follow up, urgency, voicemail, inbox",
    dashboardContextRoutes: ["/dashboard/sms"],
    relatedArticles: ["how-maria-handles-calls", "not-receiving-notifications"],
    content: `When She takes a message, you're notified immediately with:
- SMS text with quick summary
- Email with full details

### Find Messages in Your Dashboard

Go to the Messages section to see:
- Date and time the message was taken
- Caller's name and phone number
- What they needed
- Urgency level (low, medium, high)
- Audio recording of what they said

### What to Do with Messages

- **Mark as read** — Track which ones you've reviewed
- **Follow up** — Call them back directly from the message
- **Add to CRM** — Send details to your system for tracking
- **Review for patterns** — If she keeps getting the same question, add it to your profile`,
    titleEs: "Ver los mensajes que tomó tu recepcionista",
    contentEs: `Cuando ella toma un mensaje, te notifica de inmediato con:
- SMS con un resumen rápido
- Email con los detalles completos

### Encuentra mensajes en tu panel

Ve a la sección de Mensajes para ver:
- Fecha y hora en que se tomó el mensaje
- Nombre y número de teléfono de quien llamó
- Qué necesitaban
- Nivel de urgencia (bajo, medio, alto)
- Grabación de audio de lo que dijeron

### Qué hacer con los mensajes

- **Marcar como leído** — Lleva control de cuáles ya revisaste
- **Dar seguimiento** — Devuélveles la llamada directamente desde el mensaje
- **Agregar al CRM** — Envía los detalles a tu sistema para darle seguimiento
- **Revisa patrones** — Si sigue recibiendo la misma pregunta, agrégala a tu perfil`,
    searchKeywordsEs: "mensajes, notificaciones, sms, seguimiento, urgencia, buzón de voz, bandeja",
  },
  {
    slug: "when-calls-transfer",
    categorySlug: "managing-calls",
    title: "When Calls Get Transferred to You",
    sortOrder: 13,
    searchKeywords: "transfer, emergency, escalation, handoff, urgent, hold",
    dashboardContextRoutes: ["/dashboard/calls"],
    relatedArticles: ["how-maria-handles-calls", "improve-maria-responses"],
    content: `She knows when to transfer a call:

**Your receptionist transfers when:**
- Caller specifically asks to speak with you or your team
- She detects an emergency
- The topic is outside her training

**How transfers work:**
1. You get an instant SMS alert with call details
2. The caller is put on brief hold or stays in conversation
3. If you don't answer within a short time, She takes a message
4. You can follow up on your schedule

**Emergency transfers:**
- You receive a high-priority SMS marked urgent
- The call transfers immediately
- Act fast — these callers need help right away

### Check Transfer History

In the Calls section, see which calls were transferred and why. This helps you understand where your receptionist might need more information added to your profile.

## Improve your receptionist's Responses

Your receptionist gets smarter when you help her. Go through these steps regularly:

1. **Update your business profile** — Add services, pricing, FAQs, hours, service area
2. **Review call transcripts** — Check where she struggled or transferred calls
3. **Customize your greeting** — Keep it fresh and informative

The more information you provide, the more calls She can handle without transferring to you.

Need help? Email support@captahq.com or call (830) 521-7133.`,
    titleEs: "Cuándo se te transfieren las llamadas",
    contentEs: `Ella sabe cuándo transferir una llamada:

**Tu recepcionista transfiere cuando:**
- La persona pide hablar contigo o con tu equipo específicamente
- Detecta una emergencia
- El tema está fuera de su entrenamiento

**Cómo funcionan las transferencias:**
1. Recibes una alerta SMS instantánea con los detalles de la llamada
2. La persona que llama queda en espera breve o sigue en conversación
3. Si no contestas a tiempo, ella toma un mensaje
4. Puedes dar seguimiento cuando te convenga

**Transferencias de emergencia:**
- Recibes un SMS de alta prioridad marcado como urgente
- La llamada se transfiere de inmediato
- Actúa rápido — estas personas necesitan ayuda ya

### Revisa el historial de transferencias

En la sección de Llamadas, mira cuáles llamadas fueron transferidas y por qué. Esto te ayuda a entender dónde tu recepcionista podría necesitar más información en tu perfil.

## Mejora las respuestas de tu recepcionista

Tu recepcionista mejora cuando la ayudas. Haz estos pasos regularmente:

1. **Actualiza tu perfil de negocio** — Agrega servicios, precios, FAQs, horarios, área de servicio
2. **Revisa las transcripciones** — Checa dónde tuvo problemas o transfirió llamadas
3. **Personaliza tu saludo** — Mantenlo actualizado e informativo

Entre más información le des, más llamadas puede manejar sin transferirte.

¿Necesitas ayuda? Escríbenos a support@captahq.com o llama al (830) 521-7133.`,
    searchKeywordsEs: "transferencia, emergencia, escalación, traspaso, urgente, espera",
  },

  // ── Billing & Account (6 articles) ──
  {
    slug: "understanding-subscription",
    categorySlug: "billing-account",
    title: "What's Included in Your Subscription",
    sortOrder: 16,
    searchKeywords: "subscription, pricing, plan, features, annual, locations, included, unlimited",
    relatedArticles: ["billing-and-charges", "cancellation-policy"],
    content: `Your $497/month Capta subscription includes everything you need:

- **Unlimited calls** — AI receptionist answers 24/7
- **Bilingual support** — English and Spanish, no extra fee
- **Appointment booking** — Automatic scheduling into your calendar
- **SMS messaging** — Instant customer confirmations
- **CRM system** — Complete customer database
- **Call recordings** — Full transcripts and audio
- **Emergency detection** — Automatic alerts for urgent calls
- **Dashboard** — All your data in one place

### Save with Annual Billing

Choose annual billing and pay $397/month instead of $497/month. That's $100 saved every month — $1,200 per year.

### Add Multiple Locations

Each additional location costs $197/month. Manage all your locations from one dashboard.

### No Contracts

14-day free trial. Cancel anytime. No long-term contracts.`,
    titleEs: "Qué incluye tu suscripción",
    contentEs: `Tu suscripción de Capta a $497/mes incluye todo lo que necesitas:

- **Llamadas ilimitadas** — Recepcionista de IA contesta 24/7
- **Soporte bilingüe** — Inglés y español, sin costo extra
- **Agendado de citas** — Programación automática en tu calendario
- **Mensajes SMS** — Confirmaciones instantáneas al cliente
- **Sistema CRM** — Base de datos completa de clientes
- **Grabaciones de llamadas** — Transcripciones completas y audio
- **Detección de emergencias** — Alertas automáticas para llamadas urgentes
- **Panel de control** — Todos tus datos en un solo lugar

### Ahorra con facturación anual

Elige facturación anual y paga $397/mes en vez de $497/mes. Son $100 de ahorro cada mes — $1,200 al año.

### Agrega múltiples ubicaciones

Cada ubicación adicional cuesta $197/mes. Administra todas tus ubicaciones desde un solo panel.

### Sin contratos

Prueba gratuita de 14 días. Cancela cuando quieras. Sin contratos a largo plazo.`,
    searchKeywordsEs: "suscripción, precios, plan, funciones, anual, ubicaciones, incluido, ilimitado",
  },
  {
    slug: "billing-and-charges",
    categorySlug: "billing-account",
    title: "How Billing Works",
    sortOrder: 17,
    searchKeywords: "billing, payment, trial, charges, monthly, annual, declined, grace period",
    relatedArticles: ["understanding-subscription", "update-payment-method", "download-invoices"],
    content: `### Getting Started

Sign up and get full access to all features immediately. Your subscription starts from the day you sign up.

### Free Trial

Every plan starts with a 14-day free trial. Your card is on file but won't be charged until day 15. Cancel anytime during the trial.

### Monthly Billing

You're billed monthly on your signup date. Your invoice shows the exact charge date and amount.

### What If a Payment Fails?

If your card is declined, you get a 7-day grace period. We'll send email and SMS reminders to update your payment method. Your service keeps running during this time.

Update your card in **Settings → Billing** to avoid service suspension.

### Annual Billing

Choose annual billing and save $100/month. We charge your full annual amount once per year on your billing date.`,
    titleEs: "Cómo funciona la facturación",
    contentEs: `### Para empezar

Regístrate y obtén acceso completo a todas las funciones de inmediato. Tu suscripción comienza desde el día que te registras.

### Prueba gratuita de 14 días

¿No estás satisfecho? Cancela antes del día 15 y no se te cobra nada. Sin preguntas.

### Facturación mensual

Se te cobra mensualmente en la fecha en que te registraste. Tu factura muestra la fecha exacta del cargo y el monto.

### ¿Qué pasa si falla un pago?

Si tu tarjeta es rechazada, tienes un período de gracia de 7 días. Te enviaremos recordatorios por email y SMS para que actualices tu método de pago. Tu servicio sigue funcionando durante este tiempo.

Actualiza tu tarjeta en **Configuración → Facturación** para evitar la suspensión del servicio.

### Facturación anual

Elige facturación anual y ahorra $100/mes. Cobramos el monto anual completo una vez al año en tu fecha de facturación.`,
    searchKeywordsEs: "facturación, pago, prueba, cargos, mensual, anual, rechazado, período de gracia",
  },
  {
    slug: "update-payment-method",
    categorySlug: "billing-account",
    title: "Update Your Payment Method",
    sortOrder: 18,
    searchKeywords: "payment, card, stripe, update, change, credit card, debit card",
    dashboardContextRoutes: ["/dashboard/settings"],
    relatedArticles: ["billing-and-charges", "download-invoices"],
    content: `**Step 1: Go to Billing Settings**
Log in to your Capta dashboard. Click **Settings**, then **Billing**.

**Step 2: Find Your Payment Method**
You'll see your current payment method. Look for the button labeled **Update Payment Method** or **Change Card**.

**Step 3: Enter New Card Details**
Enter your card number, expiration date, and CVV code. All major credit and debit cards accepted (Visa, Mastercard, American Express, Discover).

**Secure Processing**
Your payment information is processed securely through Stripe. Capta never sees your card number—it's encrypted and handled by Stripe's secure servers.

**When the Change Takes Effect**
Your new card will be used for your next billing date. If your previous card had a failed payment, update your card as soon as possible to avoid service interruption.`,
    titleEs: "Actualiza tu método de pago",
    contentEs: `**Paso 1: Ve a configuración de facturación**
Inicia sesión en tu panel de Capta. Haz clic en **Configuración** y luego en **Facturación**.

**Paso 2: Encuentra tu método de pago**
Verás tu método de pago actual. Busca el botón que dice **Actualizar Método de Pago** o **Cambiar Tarjeta**.

**Paso 3: Ingresa los datos de la nueva tarjeta**
Ingresa el número de tarjeta, fecha de vencimiento y código CVV. Se aceptan las principales tarjetas de crédito y débito (Visa, Mastercard, American Express, Discover).

**Procesamiento seguro**
Tu información de pago se procesa de forma segura a través de Stripe. Capta nunca ve tu número de tarjeta — está encriptado y lo manejan los servidores seguros de Stripe.

**Cuándo aplica el cambio**
Tu nueva tarjeta se usará en tu próxima fecha de cobro. Si tu tarjeta anterior tuvo un pago fallido, actualízala lo antes posible para evitar interrupciones en el servicio.`,
    searchKeywordsEs: "pago, tarjeta, stripe, actualizar, cambiar, tarjeta de crédito, tarjeta de débito",
  },
  {
    slug: "download-invoices",
    categorySlug: "billing-account",
    title: "Access Your Invoices",
    sortOrder: 19,
    searchKeywords: "invoices, receipts, pdf, download, tax, deduction, history",
    relatedArticles: ["billing-and-charges", "update-payment-method"],
    content: `**Step 1: Open Billing Settings**
Log in to your Capta dashboard. Click **Settings**, then **Billing**.

**Step 2: Find Invoice History**
Scroll down to the **Invoice History** section. You'll see a list of all your invoices with dates and amounts.

**Step 3: Download as PDF**
Click the download icon next to any invoice to save it as a PDF file. Print it or store it digitally for your records.

**Use for Tax Deductions**
Capta subscriptions are a business expense. Keep your invoices for tax purposes and deduction documentation.`,
    titleEs: "Accede a tus facturas",
    contentEs: `**Paso 1: Abre configuración de facturación**
Inicia sesión en tu panel de Capta. Haz clic en **Configuración** y luego en **Facturación**.

**Paso 2: Encuentra el historial de facturas**
Baja hasta la sección de **Historial de Facturas**. Verás una lista de todas tus facturas con fechas y montos.

**Paso 3: Descarga en PDF**
Haz clic en el ícono de descarga junto a cualquier factura para guardarla como archivo PDF. Imprímela o guárdala digitalmente para tus registros.

**Úsalas para deducciones de impuestos**
Las suscripciones de Capta son un gasto de negocio. Guarda tus facturas para fines fiscales y documentación de deducciones.`,
    searchKeywordsEs: "facturas, recibos, pdf, descargar, impuestos, deducción, historial",
  },
  {
    slug: "cancellation-policy",
    categorySlug: "billing-account",
    title: "Cancellation and Refunds",
    sortOrder: 20,
    searchKeywords: "cancel, refund, free trial, data retention, termination, penalty",
    relatedArticles: ["understanding-subscription", "billing-and-charges"],
    content: `### How to Cancel

Log into your dashboard and go to **Settings → Billing → Cancel Subscription**. Click cancel and confirm your request.

### When Does Cancellation Take Effect?

Your cancellation takes effect at the end of your current billing period. You keep full access to Capta until that date.

### No Cancellation Fees

There are no early termination fees, no penalties, and no hidden charges. Cancel anytime without cost.

### 14-Day Free Trial

Every new subscriber gets a 14-day free trial. Your card is on file but won't be charged until day 15. Cancel anytime during the trial at no cost.

### What Happens to Your Data?

After cancellation, your data is retained for 30 days. During this time, you can export your customer information, call history, and appointment records. After 30 days, all data is permanently deleted.

### No Contracts

We don't require long-term contracts. Cancel whenever you want.`,
    titleEs: "Cancelación y reembolsos",
    contentEs: `### Cómo cancelar

Inicia sesión en tu panel y ve a **Configuración → Facturación → Cancelar Suscripción**. Haz clic en cancelar y confirma tu solicitud.

### ¿Cuándo aplica la cancelación?

Tu cancelación aplica al final de tu período de facturación actual. Mantienes acceso completo a Capta hasta esa fecha.

### Sin cargos por cancelación

No hay cargos por terminación anticipada, sin penalizaciones y sin cargos ocultos. Cancela cuando quieras sin costo.

### Prueba gratuita de 14 días

Si eres un suscriptor nuevo y cancelas antes del día 15, no se te cobra nada. Sin preguntas.

### ¿Qué pasa con tus datos?

Después de cancelar, tus datos se conservan por 30 días. Durante ese tiempo puedes exportar tu información de clientes, historial de llamadas y registros de citas. Después de 30 días, todos los datos se eliminan permanentemente.

### Sin contratos

No requerimos contratos a largo plazo. Cancela cuando quieras.`,
    searchKeywordsEs: "cancelar, reembolso, garantía, retención de datos, terminación, penalización",
  },
  {
    slug: "referral-program",
    categorySlug: "billing-account",
    title: "Referral Program",
    sortOrder: 21,
    searchKeywords: "referral, free month, rewards, share, code, earn, unlimited",
    dashboardContextRoutes: ["/dashboard/referrals"],
    relatedArticles: ["understanding-subscription"],
    content: `### Share Capta and Earn Free Months

Our referral program rewards you for helping other home service businesses succeed. It's free, easy, and unlimited.

**How the Program Works**
You get a unique referral code. When someone signs up using your code and stays as a paid customer for 30 days, you both receive a free month of Capta service.

**Find Your Referral Code**
Log into your dashboard. Go to **Settings → Referral Program**. Your unique code is displayed there. Copy it and share it however you like — email, text, social media, or word of mouth.

**Earn Your Reward**
Once your referral has been a paid customer for 30 days, you earn one free month of service. The reward is automatically applied to your account — no vouchers or codes needed.

**No Limits**
There's no cap on referrals. Earn as many free months as you want by referring unlimited customers.

**Track Your Referrals**
Go to **Settings → Referral Program** to see your referral history, active referrals, and earned rewards. Your dashboard shows each referral's status in real time.

Need help? Email support@captahq.com or call (830) 521-7133.`,
    titleEs: "Programa de referidos",
    contentEs: `### Comparte Capta y gana meses gratis

Nuestro programa de referidos te premia por ayudar a otros negocios de servicios del hogar a crecer. Es gratis, fácil y sin límites.

**Cómo funciona el programa**
Recibes un código de referido único. Cuando alguien se registra usando tu código y se mantiene como cliente de pago por 30 días, ambos reciben un mes gratis de servicio de Capta.

**Encuentra tu código de referido**
Inicia sesión en tu panel. Ve a **Configuración → Programa de Referidos**. Tu código único aparece ahí. Cópialo y compártelo como quieras — por email, mensaje de texto, redes sociales o de boca en boca.

**Gana tu recompensa**
Una vez que tu referido haya sido cliente de pago por 30 días, ganas un mes gratis de servicio. La recompensa se aplica automáticamente a tu cuenta — sin cupones ni códigos adicionales.

**Sin límites**
No hay tope de referidos. Gana todos los meses gratis que quieras refiriendo clientes ilimitados.

**Rastrea tus referidos**
Ve a **Configuración → Programa de Referidos** para ver tu historial de referidos, referidos activos y recompensas ganadas. Tu panel muestra el estado de cada referido en tiempo real.

¿Necesitas ayuda? Escríbenos a support@captahq.com o llama al (830) 521-7133.`,
    searchKeywordsEs: "referido, mes gratis, recompensas, compartir, código, ganar, ilimitado",
  },

  // ── Troubleshooting (6 articles) ──
  {
    slug: "maria-not-answering",
    categorySlug: "troubleshooting",
    title: "My Receptionist Isn't Answering Calls",
    sortOrder: 22,
    searchKeywords: "not answering, forwarding, outage, troubleshoot, setup, phone, calls not working",
    relatedArticles: ["check-outage", "wrong-greeting"],
    content: `If your callers can't reach your receptionist, follow these steps:

**1. Check Call Forwarding Setup**
The most common issue is that call forwarding isn't configured. Go to **Settings** and verify your business phone number is set up to forward incoming calls to your receptionist. If you haven't done this yet, see our guide on setting up call forwarding.

**2. Verify Your Account is Active**
Check that your account is paid up and not suspended. Look at your billing status in the Settings tab. If you see any warnings, update your payment information immediately.

**3. Check for Service Outages**
Visit **captahq.com/status** to see if there's a known outage. During outages, your receptionist automatically switches to voicemail mode so callers can still leave messages.

**4. Test with a Different Phone**
Try calling your business number from a different phone. This helps identify if the issue is with your specific phone or with your receptionist's service.

**5. Still Not Working?**
Contact our support team. Have your account email and business name ready.

Email: **support@captahq.com**
Phone: **(830) 521-7133**`,
    titleEs: "Mi recepcionista no contesta las llamadas",
    contentEs: `Si tus clientes no pueden comunicarse con tu recepcionista, sigue estos pasos:

**1. Revisa la configuración de desvío de llamadas**
El problema más común es que el desvío de llamadas no está configurado. Ve a **Configuración** y verifica que tu número de teléfono de negocio esté configurado para desviar las llamadas entrantes a tu recepcionista. Si no lo has hecho, consulta nuestra guía para configurar el desvío de llamadas.

**2. Verifica que tu cuenta esté activa**
Revisa que tu cuenta esté al día y no esté suspendida. Consulta el estado de tu facturación en la pestaña de Configuración. Si ves alguna alerta, actualiza tu información de pago de inmediato.

**3. Revisa si hay interrupciones del servicio**
Visita **captahq.com/status** para ver si hay alguna interrupción conocida. Durante las interrupciones, tu recepcionista cambia automáticamente a modo de buzón de voz para que los clientes puedan dejar mensajes.

**4. Prueba con otro teléfono**
Intenta llamar a tu número de negocio desde otro teléfono. Esto ayuda a identificar si el problema es con tu teléfono específico o con el servicio de tu recepcionista.

**5. ¿Sigue sin funcionar?**
Contacta a nuestro equipo de soporte. Ten listo tu correo de cuenta y nombre de negocio.

Email: **support@captahq.com**
Teléfono: **(830) 521-7133**`,
    searchKeywordsEs: "no contesta, desvío, interrupción, solución, configuración, teléfono, llamadas no funcionan",
  },
  {
    slug: "wrong-greeting",
    categorySlug: "troubleshooting",
    title: "Callers Hear the Wrong Greeting",
    sortOrder: 23,
    searchKeywords: "greeting, wrong, update, customize, message, fix",
    relatedArticles: ["improve-maria-responses", "wrong-information"],
    content: `Your greeting is what callers hear first when your receptionist picks up. It's quick to fix.

**Update Your Greeting**
Log into your dashboard and go to **Settings → AI Greeting**. Edit the greeting text to match your business. Be clear and friendly—something like "Hi, thanks for calling Smith's Plumbing. How can I help you today?"

**Save and Test**
Click **Save** when you're done. The new greeting takes effect immediately. Test it by calling your business number from your phone. You should hear the updated message.

**Tips for a Great Greeting**
- Keep it under 20 seconds
- Say your business name clearly
- Let callers know how to reach you (callback, voicemail, etc.)
- Test after any changes`,
    titleEs: "Los clientes escuchan el saludo equivocado",
    contentEs: `El saludo es lo primero que escuchan tus clientes cuando tu recepcionista contesta. Es rápido de arreglar.

**Actualiza tu saludo**
Inicia sesión en tu panel y ve a **Configuración → Saludo de IA**. Edita el texto del saludo para que coincida con tu negocio. Sé claro y amigable — algo como "Hola, gracias por llamar a Plomería Smith. ¿En qué te puedo ayudar?"

**Guarda y prueba**
Haz clic en **Guardar** cuando termines. El nuevo saludo aplica de inmediato. Pruébalo llamando a tu número de negocio desde tu teléfono. Deberías escuchar el mensaje actualizado.

**Consejos para un buen saludo**
- Que dure menos de 20 segundos
- Di el nombre de tu negocio claramente
- Hazle saber a los clientes cómo contactarte (devolución de llamada, buzón de voz, etc.)
- Prueba después de cualquier cambio`,
    searchKeywordsEs: "saludo, equivocado, actualizar, personalizar, mensaje, arreglar",
  },
  {
    slug: "wrong-information",
    categorySlug: "troubleshooting",
    title: "My Receptionist Is Giving Wrong Information",
    sortOrder: 24,
    searchKeywords: "wrong info, outdated, update, services, pricing, hours, inaccurate",
    relatedArticles: ["improve-maria-responses", "wrong-greeting"],
    content: `Your receptionist shares your business details with callers—but she only knows what you've told her. If the info is outdated, she'll repeat it.

**Update Your Settings**
Go to your dashboard and click **Settings**. Check these sections:

- **Services** — Make sure all services are listed and accurate
- **Pricing** — Update prices if you've changed them
- **Business Hours** — Confirm your hours are correct
- **Contact Info** — Verify phone number and address

**Make Your Updates**
Edit any outdated information and click **Save**. She will use the updated details on her next call.

**Keep It Current**
Review your business information monthly, especially if you add new services or change your pricing. This way, callers always get accurate answers.`,
    titleEs: "Mi recepcionista da información incorrecta",
    contentEs: `Tu recepcionista comparte los detalles de tu negocio con los clientes — pero ella solo sabe lo que tú le has dicho. Si la información está desactualizada, ella la va a repetir.

**Actualiza tu configuración**
Ve a tu panel y haz clic en **Configuración**. Revisa estas secciones:

- **Servicios** — Asegúrate de que todos los servicios estén listados y sean correctos
- **Precios** — Actualiza los precios si los cambiaste
- **Horario de atención** — Confirma que tu horario esté correcto
- **Información de contacto** — Verifica número de teléfono y dirección

**Haz tus cambios**
Edita cualquier información desactualizada y haz clic en **Guardar**. Ella usará los datos actualizados en su próxima llamada.

**Mantenlo al día**
Revisa la información de tu negocio cada mes, especialmente si agregas nuevos servicios o cambias tus precios. Así los clientes siempre reciben respuestas correctas.`,
    searchKeywordsEs: "información incorrecta, desactualizado, actualizar, servicios, precios, horario, inexacto",
  },
  {
    slug: "not-receiving-notifications",
    categorySlug: "troubleshooting",
    title: "Not Receiving Messages or Notifications",
    sortOrder: 25,
    searchKeywords: "notifications, sms, email, alerts, spam, missing, not receiving",
    dashboardContextRoutes: ["/dashboard/sms"],
    relatedArticles: ["viewing-messages", "dashboard-not-loading"],
    content: `If you're not seeing call notifications or messages from your receptionist:

**1. Verify Your Phone Number**
Go to **Settings** and confirm the phone number where you want to receive notifications is correct. If it's wrong, update it.

**2. Check Your Email Spam Folder**
Capta notifications come to your email. Check your spam folder—sometimes legitimate emails end up there. Add support@captahq.com to your contacts to ensure messages get through.

**3. Review Team Notification Settings**
Go to **Settings → Team** and check your notification preferences. Make sure notifications are enabled for your user.

**4. Verify SMS Opt-In**
For SMS notifications, you may need to confirm you've opted in. Check your Settings to enable SMS notifications.

**5. Check Do Not Disturb**
If your phone has Do Not Disturb on, you might not hear notification sounds. Check your phone's settings.`,
    titleEs: "No recibo mensajes ni notificaciones",
    contentEs: `Si no estás viendo notificaciones de llamadas o mensajes de tu recepcionista:

**1. Verifica tu número de teléfono**
Ve a **Configuración** y confirma que el número de teléfono donde quieres recibir notificaciones sea correcto. Si está mal, actualízalo.

**2. Revisa tu carpeta de spam**
Las notificaciones de Capta llegan a tu correo. Revisa tu carpeta de spam — a veces los correos legítimos terminan ahí. Agrega support@captahq.com a tus contactos para asegurar que los mensajes lleguen.

**3. Revisa la configuración de notificaciones del equipo**
Ve a **Configuración → Equipo** y revisa tus preferencias de notificación. Asegúrate de que las notificaciones estén activadas para tu usuario.

**4. Verifica la suscripción a SMS**
Para notificaciones por SMS, puede que necesites confirmar que estás suscrito. Revisa tu Configuración para activar las notificaciones por SMS.

**5. Revisa No Molestar**
Si tu teléfono tiene el modo No Molestar activado, puede que no escuches los sonidos de notificación. Revisa la configuración de tu teléfono.`,
    searchKeywordsEs: "notificaciones, sms, correo, alertas, spam, faltantes, no recibo",
  },
  {
    slug: "dashboard-not-loading",
    categorySlug: "troubleshooting",
    title: "Dashboard Not Loading or Showing Errors",
    sortOrder: 26,
    searchKeywords: "dashboard, loading, errors, browser, cache, not working, blank page",
    relatedArticles: ["check-outage", "not-receiving-notifications"],
    content: `Browser issues are the most common cause.

**1. Clear Your Browser Cache**
Cached data can cause the dashboard to load incorrectly. Clear your browser's cache and cookies, then try again. Most browsers have this under Settings → Privacy.

**2. Try Incognito or Private Mode**
Open an incognito (Chrome) or private (Safari/Firefox) window and log back into your dashboard. This uses a fresh browser session without cached data.

**3. Switch to a Different Browser**
Try a different browser (Chrome, Safari, Firefox, Edge) to see if the problem is browser-specific.

**4. Check Your Internet Connection**
Make sure you have a stable internet connection. Try disconnecting and reconnecting to WiFi, or switch to a different network.

**5. Contact Support**
If the dashboard still won't load, email support@captahq.com with a screenshot of the error. Our team can help investigate.`,
    titleEs: "El Panel No Carga o Muestra Errores",
    contentEs: `Los problemas del navegador son la causa más común.

**1. Limpia el Caché de Tu Navegador**
Los datos en caché pueden hacer que el panel cargue mal. Limpia el caché y las cookies de tu navegador, y vuelve a intentar. En la mayoría de los navegadores esto está en Configuración → Privacidad.

**2. Prueba en Modo Incógnito o Privado**
Abre una ventana de incógnito (Chrome) o privada (Safari/Firefox) e inicia sesión de nuevo en tu panel. Esto usa una sesión limpia sin datos en caché.

**3. Cambia de Navegador**
Prueba con otro navegador (Chrome, Safari, Firefox, Edge) para ver si el problema es específico de tu navegador.

**4. Revisa Tu Conexión a Internet**
Asegúrate de tener una conexión a internet estable. Intenta desconectarte y reconectarte al WiFi, o cambia a otra red.

**5. Contacta a Soporte**
Si el panel sigue sin cargar, envía un email a support@captahq.com con una captura de pantalla del error. Nuestro equipo puede ayudarte a investigar.`,
    searchKeywordsEs: "panel, cargando, errores, navegador, caché, no funciona, página en blanco",
  },
  {
    slug: "check-outage",
    categorySlug: "troubleshooting",
    title: "How to Check for Outages",
    sortOrder: 27,
    searchKeywords: "outage, status, downtime, service, maintenance, incident",
    relatedArticles: ["maria-not-answering", "dashboard-not-loading"],
    content: `If you're experiencing issues with Capta, a service outage might be the cause.

**Check the Status Page**
Visit **captahq.com/status** for real-time information about the Capta service. The status page shows:

- **Voice Service** — AI receptionist answering calls
- **SMS** — Message delivery
- **Dashboard** — Account management
- **API** — Integrations

**What Happens During an Outage**
If there's an outage affecting your receptionist's voice service, she automatically switches to voicemail mode. Callers can still leave messages, and you'll still get notifications.

**Subscribe for Updates**
On the status page, you can subscribe to status notifications. When issues occur, you'll get email alerts automatically.

**Still Having Issues?**
If the status page shows everything is normal but you're still having problems, contact our support team.

## How to Contact Support

When you need help, our support team is here for you.

**Email Support**
**support@captahq.com**

Send us a detailed message describing your issue. Include your business name and any error messages you've seen. We typically respond within a few hours on business days.

**Phone Support**
**(830) 521-7133**

Call us during business hours to speak directly with a team member. Have your account information ready.

**In-Dashboard Help**
In your Capta dashboard, go to the **Help** section. There's a feedback form where you can describe your issue and get assistance.

**Tips for Faster Support**
- Include your business name and account email
- Describe the exact issue you're experiencing
- Mention any steps you've already tried
- Include screenshots if relevant`,
    titleEs: "Cómo Verificar si Hay una Interrupción del Servicio",
    contentEs: `Si estás teniendo problemas con Capta, puede ser por una interrupción del servicio.

**Revisa la Página de Estado**
Visita **captahq.com/status** para ver información en tiempo real sobre el servicio de Capta. La página de estado muestra:

- **Servicio de Voz** — Tu recepcionista AI contestando llamadas
- **SMS** — Entrega de mensajes
- **Panel** — Gestión de cuenta
- **API** — Integraciones

**Qué Pasa Durante una Interrupción**
Si hay una interrupción que afecta el servicio de voz de tu recepcionista, ella cambia automáticamente a modo de buzón de voz. Los clientes aún pueden dejar mensajes, y tú sigues recibiendo notificaciones.

**Suscríbete para Recibir Actualizaciones**
En la página de estado, puedes suscribirte a notificaciones. Cuando ocurran problemas, recibirás alertas por email automáticamente.

**¿Sigues con Problemas?**
Si la página de estado muestra que todo está normal pero sigues teniendo problemas, contacta a nuestro equipo de soporte.

## Cómo Contactar a Soporte

Cuando necesites ayuda, nuestro equipo de soporte está para ti.

**Soporte por Email**
**support@captahq.com**

Envíanos un mensaje detallado describiendo tu problema. Incluye el nombre de tu negocio y cualquier mensaje de error que hayas visto. Normalmente respondemos en pocas horas en días hábiles.

**Soporte Telefónico**
**(830) 521-7133**

Llámanos en horario laboral para hablar directamente con un miembro del equipo. Ten tu información de cuenta lista.

**Ayuda en el Panel**
En tu panel de Capta, ve a la sección de **Ayuda**. Hay un formulario donde puedes describir tu problema y recibir asistencia.

**Tips para Soporte Más Rápido**
- Incluye el nombre de tu negocio y email de cuenta
- Describe exactamente el problema que estás teniendo
- Menciona los pasos que ya intentaste
- Incluye capturas de pantalla si es relevante`,
    searchKeywordsEs: "interrupción, estado, caída, servicio, mantenimiento, incidente",
  },

  // ── Features & Tips (6 articles) ──
  {
    slug: "monthly-report",
    categorySlug: "features-tips",
    title: "Your Monthly Report",
    sortOrder: 29,
    searchKeywords: "report, analytics, metrics, calls, appointments, data, monthly, trends, growth",
    dashboardContextRoutes: ["/dashboard"],
    relatedArticles: ["nps-health-score", "understanding-call-logs"],
    content: `Every month, your receptionist gives you a complete summary of all the work she's done for your business. You'll find your report in the **Reports** section of your dashboard.

### What's in Your Report

- **Total Calls Handled** — How many calls your receptionist answered for you
- **Appointments Booked** — How many customers scheduled services with you
- **Calls by Time of Day** — Which hours get the most calls (peak times)
- **Calls by Day of Week** — Which days are busiest
- **Top Services Requested** — What services customers ask about most
- **Customer Satisfaction Scores** — How happy your callers were
- **Missed Call Recovery Rate** — How many customers we followed up with after missing a call

### How to Use This Data

**Spot Your Busy Times**
Look at the "Calls by Time of Day" and "Calls by Day of Week" sections. If you see a pattern (like Tuesday mornings are always busy), you can staff up or adjust your schedule.

**See Which Services Get Traction**
The "Top Services Requested" tells you what customers are calling about. This helps you know where to focus your marketing or inventory.

**Track Month-Over-Month Growth**
Save your reports and compare them. Are you getting more calls each month? More appointments? That's a sign she is working for you.

**Check Customer Satisfaction**
High satisfaction scores mean customers are happy with your receptionist's responses. Low scores? It might be time to update your business information or FAQs.`,
    titleEs: "Tu Reporte Mensual",
    contentEs: `Cada mes, tu recepcionista te da un resumen completo de todo el trabajo que hizo para tu negocio. Encontrarás tu reporte en la sección de **Reportes** de tu panel.

### Qué Incluye Tu Reporte

- **Total de Llamadas Atendidas** — Cuántas llamadas contestó tu recepcionista por ti
- **Citas Agendadas** — Cuántos clientes programaron servicios contigo
- **Llamadas por Hora del Día** — Qué horas reciben más llamadas (horas pico)
- **Llamadas por Día de la Semana** — Qué días son los más ocupados
- **Servicios Más Solicitados** — Qué servicios preguntan más los clientes
- **Puntuaciones de Satisfacción** — Qué tan contentos quedaron tus clientes
- **Tasa de Recuperación de Llamadas Perdidas** — A cuántos clientes les dimos seguimiento después de perder una llamada

### Cómo Usar Esta Información

**Identifica Tus Horas Pico**
Revisa las secciones de "Llamadas por Hora del Día" y "Llamadas por Día de la Semana". Si ves un patrón (como que los martes en la mañana siempre están ocupados), puedes ajustar tu agenda.

**Ve Qué Servicios Tienen Más Demanda**
Los "Servicios Más Solicitados" te dicen por qué están llamando los clientes. Esto te ayuda a saber dónde enfocar tu marketing o inventario.

**Rastrea el Crecimiento Mes a Mes**
Guarda tus reportes y compáralos. ¿Estás recibiendo más llamadas cada mes? ¿Más citas? Eso es señal de que ella está trabajando para ti.

**Revisa la Satisfacción del Cliente**
Puntuaciones altas significan que los clientes están contentos con las respuestas de tu recepcionista. ¿Puntuaciones bajas? Puede ser hora de actualizar la información de tu negocio o las preguntas frecuentes.`,
    searchKeywordsEs: "reporte, analíticas, métricas, llamadas, citas, datos, mensual, tendencias, crecimiento",
  },
  {
    slug: "nps-health-score",
    categorySlug: "features-tips",
    title: "Understanding Your NPS (Net Promoter Score)",
    sortOrder: 30,
    searchKeywords: "nps, score, satisfaction, promoter, detractor, health, survey, customer feedback",
    relatedArticles: ["monthly-report", "improve-maria-responses"],
    content: `**NPS stands for Net Promoter Score.** It's a simple way to measure how satisfied your customers are with your receptionist on a scale from **-100 to 100**.

After certain calls, Capta sends a quick follow-up survey to your customers. The question is simple: "How likely are you to recommend this business?" Customers respond on a scale of 0 to 10.

### How the Scoring Works

- **Scores 9-10** — Promoters. Customers love you and will recommend you.
- **Scores 7-8** — Passive. Customers are satisfied but not enthusiastic.
- **Scores 0-6** — Detractors. Customers aren't happy and might leave bad reviews.

We calculate your NPS by subtracting the percentage of detractors from the percentage of promoters. That's your health score.

### What Does Your Score Mean?

- **Above 50** — Excellent. Your customers love you.
- **0-50** — Good, but room to improve.
- **Below 0** — Time to make changes.

### How to Improve Your NPS

**Listen to Detractors**
When customers give low scores, they often leave comments. Read them. These are golden insights into what's not working.

**Respond and Fix Issues**
If customers complain about your receptionist's responses, update your business profile, pricing, or FAQ section. Train her better by giving her more information.

**Encourage Promoters**
When customers love you, ask them to leave reviews on Google or Yelp. Promoters are your best marketing tool.

**Monitor Trends**
Check your NPS every month. Are you improving? Track what changes helped.`,
    titleEs: "Entendiendo Tu NPS (Net Promoter Score)",
    contentEs: `**NPS significa Net Promoter Score.** Es una forma sencilla de medir qué tan satisfechos están tus clientes con tu recepcionista en una escala de **-100 a 100**.

Después de ciertas llamadas, Capta envía una encuesta rápida de seguimiento a tus clientes. La pregunta es simple: "¿Qué tan probable es que recomiendes este negocio?" Los clientes responden en una escala del 0 al 10.

### Cómo Funciona la Puntuación

- **Puntuación 9-10** — Promotores. Los clientes te aman y te van a recomendar.
- **Puntuación 7-8** — Pasivos. Los clientes están satisfechos pero no entusiasmados.
- **Puntuación 0-6** — Detractores. Los clientes no están contentos y podrían dejar malas reseñas.

Calculamos tu NPS restando el porcentaje de detractores del porcentaje de promotores. Ese es tu puntaje de salud.

### ¿Qué Significa Tu Puntuación?

- **Arriba de 50** — Excelente. Tus clientes te aman.
- **0-50** — Bien, pero hay espacio para mejorar.
- **Debajo de 0** — Es hora de hacer cambios.

### Cómo Mejorar Tu NPS

**Escucha a los Detractores**
Cuando los clientes dan puntuaciones bajas, muchas veces dejan comentarios. Léelos. Son información valiosa sobre lo que no está funcionando.

**Responde y Resuelve Problemas**
Si los clientes se quejan de las respuestas de tu recepcionista, actualiza tu perfil de negocio, precios o sección de preguntas frecuentes. Entrénala mejor dándole más información.

**Motiva a los Promotores**
Cuando los clientes te aman, pídeles que dejen reseñas en Google o Yelp. Los promotores son tu mejor herramienta de marketing.

**Monitorea las Tendencias**
Revisa tu NPS cada mes. ¿Estás mejorando? Rastrea qué cambios ayudaron.`,
    searchKeywordsEs: "nps, puntuación, satisfacción, promotor, detractor, salud, encuesta, retroalimentación",
  },
  {
    slug: "improve-maria-responses",
    categorySlug: "features-tips",
    title: "How to Improve your receptionist's Responses",
    sortOrder: 31,
    searchKeywords: "improve, profile, faq, greeting, customize, training, better responses",
    relatedArticles: ["tips-best-results", "wrong-information", "wrong-greeting"],
    content: `Your receptionist gets smarter the more information you give her. Here are three simple ways to level up.

### 1. Update Your Business Profile

Go to Settings and make sure your business profile is complete and accurate:

- **Services** — List every service you offer with clear descriptions
- **Pricing** — Include service prices. If pricing varies, explain what affects the cost
- **Hours** — Set your business hours so she knows when to book appointments
- **FAQs** — Add answers to the questions you get asked most often. This is gold for her
- **Service area** — Tell her what areas you serve
- **Warranties or guarantees** — Include any promises you make to customers

### 2. Review Call Transcripts for Gaps

Spend 15 minutes a week reviewing call transcripts where she struggled or transferred the call. Look for patterns:

- Did callers ask about something she didn't know?
- Was there a topic that came up multiple times?
- What questions should she have been able to answer?

Once you identify gaps, add that information to your business profile or FAQs.

### 3. Customize Your AI Greeting

Your greeting sets the tone. A good greeting tells callers what to expect and how she can help:

- Include your business name and what you do
- Let people know she is an AI receptionist and what she can help with (appointments, questions, etc.)
- Let them know they can ask to speak with a human if they prefer

When callers understand what she can do, they ask better questions and she can help more often.`,
    titleEs: "Cómo Mejorar las Respuestas de Tu Recepcionista",
    contentEs: `Tu recepcionista se vuelve más inteligente entre más información le des. Aquí hay tres formas sencillas de mejorarla.

### 1. Actualiza Tu Perfil de Negocio

Ve a Configuración y asegúrate de que tu perfil de negocio esté completo y correcto:

- **Servicios** — Lista cada servicio que ofreces con descripciones claras
- **Precios** — Incluye los precios de tus servicios. Si los precios varían, explica qué afecta el costo
- **Horarios** — Configura tu horario de trabajo para que ella sepa cuándo agendar citas
- **Preguntas Frecuentes** — Agrega respuestas a las preguntas que más te hacen. Esto es oro para ella
- **Área de servicio** — Dile qué áreas cubres
- **Garantías** — Incluye cualquier promesa que le hagas a los clientes

### 2. Revisa las Transcripciones de Llamadas para Encontrar Vacíos

Dedica 15 minutos a la semana revisando las transcripciones donde ella tuvo dificultades o transfirió la llamada. Busca patrones:

- ¿Los clientes preguntaron algo que ella no sabía?
- ¿Hubo algún tema que surgió varias veces?
- ¿Qué preguntas debería haber podido responder?

Una vez que identifiques los vacíos, agrega esa información a tu perfil de negocio o preguntas frecuentes.

### 3. Personaliza Tu Saludo de AI

Tu saludo marca el tono. Un buen saludo le dice a los clientes qué esperar y cómo ella puede ayudar:

- Incluye el nombre de tu negocio y a qué te dedicas
- Hazle saber a la gente que ella es una recepcionista AI y en qué puede ayudar (citas, preguntas, etc.)
- Diles que pueden pedir hablar con una persona si lo prefieren

Cuando los clientes entienden lo que ella puede hacer, hacen mejores preguntas y ella puede ayudar más seguido.`,
    searchKeywordsEs: "mejorar, perfil, preguntas frecuentes, saludo, personalizar, entrenamiento, mejores respuestas",
  },
  {
    slug: "tips-best-results",
    categorySlug: "features-tips",
    title: "5 Tips for Getting the Best Results from Your Receptionist",
    sortOrder: 32,
    searchKeywords: "tips, best practices, calendar, profile, greeting, faq, optimization",
    relatedArticles: ["improve-maria-responses", "what-is-capta"],
    content: `Your AI receptionist is your team member, and like any team member, she works better when you set her up for success.

### Tip 1: Fill Out Your Business Profile Completely

Your receptionist needs to know everything about your business:
- Every service you offer
- Pricing for each service
- Your service area and coverage zones
- Your hours of operation
- Any special certifications or licenses

### Tip 2: Add Common Questions and Answers

Think about the questions customers ask most often. Add these to your FAQ section in the dashboard. When customers ask, she already knows your answer.

### Tip 3: Keep Your Calendar Up to Date

She books appointments based on your available time. If your calendar is outdated, she'll book appointments you can't keep. Update it regularly and mark days off, lunch breaks, and admin time.

### Tip 4: Review Call Summaries Weekly

Spend 15 minutes reviewing your receptionist's call summaries. Look for patterns and use these insights to improve your profile and FAQ.

### Tip 5: Update Your Greeting Seasonally

your receptionist's greeting can change with the seasons. During winter, mention your holiday hours or emergency availability. In spring, highlight seasonal services like yard cleanup.`,
    titleEs: "5 Tips para Obtener los Mejores Resultados de Tu Recepcionista",
    contentEs: `Tu recepcionista AI es parte de tu equipo, y como cualquier miembro del equipo, ella trabaja mejor cuando la preparas para el éxito.

### Tip 1: Llena Tu Perfil de Negocio Completamente

Tu recepcionista necesita saber todo sobre tu negocio:
- Cada servicio que ofreces
- Precios de cada servicio
- Tu área de servicio y zonas de cobertura
- Tu horario de operación
- Cualquier certificación o licencia especial

### Tip 2: Agrega Preguntas y Respuestas Comunes

Piensa en las preguntas que los clientes hacen más seguido. Agrégalas a tu sección de Preguntas Frecuentes en el panel. Cuando los clientes pregunten, ella ya sabe tu respuesta.

### Tip 3: Mantén Tu Calendario Actualizado

Ella agenda citas según tu tiempo disponible. Si tu calendario está desactualizado, va a agendar citas que no puedes cumplir. Actualízalo regularmente y marca días libres, hora de comida y tiempo administrativo.

### Tip 4: Revisa los Resúmenes de Llamadas Semanalmente

Dedica 15 minutos a revisar los resúmenes de llamadas de tu recepcionista. Busca patrones y usa esa información para mejorar tu perfil y preguntas frecuentes.

### Tip 5: Actualiza Tu Saludo por Temporada

El saludo de tu recepcionista puede cambiar con las temporadas. En invierno, menciona tu horario de fiestas o disponibilidad para emergencias. En primavera, destaca servicios de temporada como limpieza de jardín.`,
    searchKeywordsEs: "tips, mejores prácticas, calendario, perfil, saludo, preguntas frecuentes, optimización",
  },
  {
    slug: "bilingual-callers",
    categorySlug: "features-tips",
    title: "How Your Receptionist Handles Bilingual Callers",
    sortOrder: 33,
    searchKeywords: "bilingual, spanish, english, language, detection, switch, multilingual",
    relatedArticles: ["what-is-capta", "how-maria-handles-calls"],
    content: `One of your receptionist's best features is her ability to handle calls in both English and Spanish—automatically. You don't need to do anything special to set it up.

### How Language Detection Works

When a customer calls, your receptionist listens to the first few seconds of their speech and automatically detects whether they're speaking English or Spanish. Then she responds in that same language for the rest of the call.

It's seamless and happens in real-time. The caller never has to repeat themselves or ask for a Spanish-speaking receptionist.

### What If a Caller Switches Languages?

If a customer starts in English and then switches to Spanish mid-call (or vice versa), she switches languages too. She's fluent in both and makes the transition naturally.

This is especially helpful for bilingual customers who mix languages in a single conversation.

### Checking Language in Your Records

When you review your call logs in the dashboard, you'll see the detected language for each call. Call transcripts are always in the original language the caller used.`,
    titleEs: "Cómo Tu Recepcionista Maneja Llamadas Bilingües",
    contentEs: `Una de las mejores funciones de tu recepcionista es su capacidad para atender llamadas en inglés y español — automáticamente. No necesitas hacer nada especial para configurarlo.

### Cómo Funciona la Detección de Idioma

Cuando un cliente llama, tu recepcionista escucha los primeros segundos de su conversación y detecta automáticamente si están hablando inglés o español. Luego ella responde en ese mismo idioma durante el resto de la llamada.

Es fluido y pasa en tiempo real. El cliente nunca tiene que repetirse ni pedir una recepcionista que hable español.

### ¿Qué Pasa si un Cliente Cambia de Idioma?

Si un cliente empieza en inglés y luego cambia a español a mitad de la llamada (o viceversa), ella también cambia de idioma. Ella domina ambos y hace la transición de forma natural.

Esto es especialmente útil para clientes bilingües que mezclan idiomas en una sola conversación.

### Revisando el Idioma en Tus Registros

Cuando revisas tus registros de llamadas en el panel, verás el idioma detectado para cada llamada. Las transcripciones siempre están en el idioma original que usó el cliente.`,
    searchKeywordsEs: "bilingüe, español, inglés, idioma, detección, cambio, multilingüe",
  },
  {
    slug: "data-protection",
    categorySlug: "features-tips",
    title: "Data Protection and Security",
    sortOrder: 34,
    searchKeywords: "security, encryption, data, privacy, export, delete, tls, retention, gdpr",
    relatedArticles: ["cancellation-policy"],
    content: `Your data is secure with Capta. Your business data, customer information, and call recordings are protected with industry-standard security practices.

### How We Protect Your Data

**Encryption in Transit**
All data traveling between your devices and Capta's servers is encrypted using TLS (Transport Layer Security).

**Encryption at Rest**
Your data stored on our servers is encrypted. Even if someone accessed our servers physically, they couldn't read your data without the encryption keys.

**No Passwords**
Capta supports password login (primary) and magic link login as a fallback. With magic links, you receive a secure link via email, click it, and you're logged in — no password needed.

**Role-Based Access**
If you add team members to your Capta account, you control what they can see.

### Data Retention

We don't keep your data longer than necessary:

- **Call Recordings** — Kept for 12 months, then deleted
- **Call Metadata** — Kept for 24 months, then deleted
- **Consent Records** — Kept for 7 years (required by law)

### Your Rights: Export or Delete Your Data

Your data belongs to you. You have the right to:

**Export Your Data**
At any time, you can export all your data (call logs, recordings, business profile, etc.) in a standard format.

**Delete Your Data**
You can request deletion of your data. Capta will delete your account and all associated information within 30 days.

Both options are available in your Settings dashboard.

Need help? Email support@captahq.com or call (830) 521-7133.`,
    titleEs: "Protección de Datos y Seguridad",
    contentEs: `Tus datos están seguros con Capta. La información de tu negocio, datos de clientes y grabaciones de llamadas están protegidos con prácticas de seguridad estándar de la industria.

### Cómo Protegemos Tus Datos

**Encriptación en Tránsito**
Todos los datos que viajan entre tus dispositivos y los servidores de Capta están encriptados usando TLS (Transport Layer Security).

**Encriptación en Reposo**
Tus datos almacenados en nuestros servidores están encriptados. Aunque alguien accediera físicamente a nuestros servidores, no podría leer tus datos sin las llaves de encriptación.

**Sin Contraseñas**
Capta soporta inicio de sesión con contraseña (principal) y enlace mágico como alternativa. Con enlaces mágicos, recibes un enlace seguro por email, haces clic, y ya estás dentro — sin necesidad de contraseña.

**Acceso Basado en Roles**
Si agregas miembros de equipo a tu cuenta de Capta, tú controlas lo que pueden ver.

### Retención de Datos

No guardamos tus datos más tiempo del necesario:

- **Grabaciones de Llamadas** — Se guardan por 12 meses, luego se eliminan
- **Metadatos de Llamadas** — Se guardan por 24 meses, luego se eliminan
- **Registros de Consentimiento** — Se guardan por 7 años (requerido por ley)

### Tus Derechos: Exportar o Eliminar Tus Datos

Tus datos te pertenecen. Tienes derecho a:

**Exportar Tus Datos**
En cualquier momento, puedes exportar todos tus datos (registros de llamadas, grabaciones, perfil de negocio, etc.) en un formato estándar.

**Eliminar Tus Datos**
Puedes solicitar la eliminación de tus datos. Capta eliminará tu cuenta y toda la información asociada en un plazo de 30 días.

Ambas opciones están disponibles en la sección de Configuración de tu panel.

¿Necesitas ayuda? Envía un email a support@captahq.com o llama al (830) 521-7133.`,
    searchKeywordsEs: "seguridad, encriptación, datos, privacidad, exportar, eliminar, tls, retención, gdpr",
  },

  // ── For Prospects (4 articles) ──
  {
    slug: "how-ai-receptionists-work",
    categorySlug: "for-prospects",
    title: "How AI Receptionists Work",
    sortOrder: 35,
    searchKeywords: "ai receptionist, technology, ivr, comparison, how it works, chatgpt, conversation, natural",
    relatedArticles: ["capta-vs-receptionist", "what-is-capta"],
    content: `Traditional phone systems make you "press 1 for billing, 2 for support." Those systems are frustrating because they don't understand what callers really want. AI receptionists are different. She has a conversation, just like a real person would.

### Your Receptionist's Call Handling

**Step 1: Listen and Understand**
When a caller reaches your receptionist, she listens to their first sentence and understands what they need immediately. No menus, no confusion.

**Step 2: Ask Clarifying Questions**
She doesn't pretend to know everything. If she needs more info, she asks natural questions. The conversation feels normal, not scripted.

**Step 3: Provide Information**
She answers questions about your services, pricing, availability, and hours. She uses the business profile you set up.

**Step 4: Book an Appointment**
If the caller wants to schedule something, she checks your availability and books it. She confirms the date, time, and caller info. The appointment appears in your Capta dashboard immediately.

**Step 5: Take a Message (If Needed)**
If you're fully booked or the caller can't schedule, she offers to take a message. She records the caller's name, phone, and issue, then sends you a summary.

### The Technology Behind It

Your AI receptionist uses advanced language AI (similar to ChatGPT) trained specifically for customer service. She understands context, tone, and intent. She sounds natural because she's having a real conversation, not reading a script.

### What Makes It Better Than Old Systems

| Traditional IVR | AI Receptionist (Capta) |
|-----------------|------------------------|
| "Press 1 for..." (confusing) | Natural conversation |
| No understanding of context | Understands what callers really need |
| Can't book appointments | Schedules directly to your calendar |
| Callers hate them | Callers appreciate the service |

### What She Can't Do

She is designed for appointment scheduling and simple Q&A. She's not built for complex issues that need a real expert. If a caller has a technical problem that needs your expertise, she offers to take their info and have you call them back.

### Why Contractors Love This

You finally have someone answering your phone 24/7 who actually understands what customers want. No more missed calls. No more frustration. Just smooth, professional conversations that lead to booked jobs.`,
    titleEs: "Cómo Funcionan las Recepcionistas IA",
    contentEs: `Los sistemas telefónicos tradicionales te hacen "presionar 1 para facturación, 2 para soporte." Esos sistemas son frustrantes porque no entienden lo que realmente necesitan las personas que llaman. Las recepcionistas IA son diferentes. Ella tiene una conversación, tal como lo haría una persona real.

### Cómo Maneja las Llamadas Tu Recepcionista

**Paso 1: Escuchar y Entender**
Cuando alguien llama a tu recepcionista, ella escucha su primera oración y entiende lo que necesitan de inmediato. Sin menús, sin confusión.

**Paso 2: Hacer Preguntas Aclaratorias**
No pretende saberlo todo. Si necesita más información, hace preguntas naturales. La conversación se siente normal, no como un guión.

**Paso 3: Dar Información**
Responde preguntas sobre tus servicios, precios, disponibilidad y horarios. Usa el perfil de negocio que tú configuraste.

**Paso 4: Agendar una Cita**
Si la persona quiere agendar algo, ella revisa tu disponibilidad y lo reserva. Confirma la fecha, hora e información del cliente. La cita aparece en tu panel de Capta de inmediato.

**Paso 5: Tomar un Mensaje (Si es Necesario)**
Si estás lleno o la persona no puede agendar, ella ofrece tomar un mensaje. Registra el nombre, teléfono y problema de la persona, y te envía un resumen.

### La Tecnología Detrás

Tu recepcionista IA usa inteligencia artificial avanzada (similar a ChatGPT) entrenada específicamente para servicio al cliente. Ella entiende contexto, tono e intención. Suena natural porque está teniendo una conversación real, no leyendo un guión.

### Qué la Hace Mejor que los Sistemas Viejos

| IVR Tradicional | Recepcionista IA (Capta) |
|-----------------|------------------------|
| "Presione 1 para..." (confuso) | Conversación natural |
| No entiende contexto | Entiende lo que realmente necesitan |
| No puede agendar citas | Agenda directamente en tu calendario |
| A la gente le molestan | La gente aprecia el servicio |

### Lo Que No Puede Hacer

Está diseñada para agendar citas y responder preguntas simples. No está hecha para problemas complejos que necesitan un experto real. Si alguien tiene un problema técnico que necesita tu experiencia, ella ofrece tomar sus datos para que les devuelvas la llamada.

### Por Qué a los Contratistas les Encanta

Finalmente tienes a alguien contestando tu teléfono 24/7 que realmente entiende lo que quieren los clientes. Sin llamadas perdidas. Sin frustración. Solo conversaciones profesionales que llevan a trabajos agendados.`,
    searchKeywordsEs: "recepcionista ia, tecnología, ivr, comparación, cómo funciona, chatgpt, conversación, natural",
  },
  {
    slug: "capta-vs-receptionist",
    categorySlug: "for-prospects",
    title: "Capta vs Hiring a Human Receptionist",
    sortOrder: 36,
    searchKeywords: "comparison, cost, receptionist, hiring, versus, human, price, savings",
    relatedArticles: ["how-ai-receptionists-work", "missed-calls-cost-money"],
    content: `Not sure if AI or hiring is right for you? Here's the honest comparison.

### The Quick Comparison

| Feature | Capta | Human Receptionist |
|---------|------------------|-------------------|
| **Monthly Cost** | $497 | $2,500–$3,500 |
| **Annual Cost** | $5,964 | $30,000–$42,000 |
| **Hours Available** | 24/7 | Usually 9am–5pm |
| **Languages** | English + Spanish | Usually one |
| **Sick Days / Vacation** | Never | Yes |
| **Training Time** | Minutes | Weeks |
| **Scales to Multiple Locations** | Yes ($197/mo each) | Need to hire more staff |
| **Can Book Appointments** | Yes (automated) | Yes |
| **Handles Complex Issues** | Takes info, you call back | Resolves on the spot |

### When Capta Makes Sense

**You're starting out** — You can't afford $30K/year for a receptionist. Capta lets you start at $497/month.

**You're overwhelmed with calls** — You're missing sales because you can't answer the phone. She answers every call 24/7.

**You have multiple locations** — Hiring a receptionist per location is expensive. Add Capta to a new location for just $197/month.

**You serve Spanish speakers** — Finding a bilingual receptionist is hard. She handles English + Spanish automatically.

**You want 24/7 coverage** — Receptionists work 9-5. Your receptionist never sleeps. Emergencies at midnight? She answers.

### When You Might Hire a Receptionist

**You need complex problem-solving** — If most calls require judgment calls or customer relationship building, a human is better.

**You want face-to-face interaction** — A receptionist can greet walk-in clients. Capta only handles phone.

**You want someone to handle multiple roles** — A receptionist might also do scheduling, invoicing, or admin. Your receptionist focuses on calls.

**You have super high call volume** — If you get 1,000+ calls per month, you might need a hybrid approach.

### The Hybrid Approach

Many successful contractors use both: She answers 24/7 calls and books routine appointments. During business hours, a human receptionist handles complex issues and manages office tasks. This is usually cheaper than hiring full-time reception staff and gives you the best of both worlds.`,
    titleEs: "Capta vs Contratar una Recepcionista Humana",
    contentEs: `¿No estás seguro si la IA o contratar es lo correcto? Aquí va la comparación honesta.

### Comparación Rápida

| Característica | Capta | Recepcionista Humana |
|---------|------------------|-------------------|
| **Costo Mensual** | $497 | $2,500–$3,500 |
| **Costo Anual** | $5,964 | $30,000–$42,000 |
| **Horas Disponibles** | 24/7 | Generalmente 9am–5pm |
| **Idiomas** | Inglés + Español | Generalmente uno |
| **Días de Enfermedad / Vacaciones** | Nunca | Sí |
| **Tiempo de Entrenamiento** | Minutos | Semanas |
| **Escala a Múltiples Ubicaciones** | Sí ($197/mes cada una) | Necesitas contratar más personal |
| **Puede Agendar Citas** | Sí (automatizado) | Sí |
| **Maneja Problemas Complejos** | Toma datos, tú devuelves la llamada | Resuelve en el momento |

### Cuándo Tiene Sentido Capta

**Estás empezando** — No puedes pagar $30K/año por una recepcionista. Capta te permite empezar a $497/mes.

**Estás abrumado con llamadas** — Estás perdiendo ventas porque no puedes contestar el teléfono. Ella contesta cada llamada 24/7.

**Tienes múltiples ubicaciones** — Contratar una recepcionista por ubicación es caro. Agrega Capta a una nueva ubicación por solo $197/mes.

**Atiendes hispanohablantes** — Encontrar una recepcionista bilingüe es difícil. Ella maneja inglés + español automáticamente.

**Quieres cobertura 24/7** — Las recepcionistas trabajan de 9 a 5. Tu recepcionista nunca duerme. ¿Emergencias a medianoche? Ella contesta.

### Cuándo Podrías Contratar una Recepcionista

**Necesitas resolución de problemas complejos** — Si la mayoría de las llamadas requieren juicio o relaciones con clientes, una persona es mejor.

**Quieres interacción cara a cara** — Una recepcionista puede recibir clientes que lleguen. Capta solo maneja el teléfono.

**Quieres alguien que haga múltiples roles** — Una recepcionista también puede hacer agendado, facturación o administración. Tu recepcionista se enfoca en llamadas.

**Tienes volumen de llamadas muy alto** — Si recibes 1,000+ llamadas al mes, podrías necesitar un enfoque híbrido.

### El Enfoque Híbrido

Muchos contratistas exitosos usan ambos: ella contesta llamadas 24/7 y agenda citas rutinarias. Durante horario de oficina, una recepcionista humana maneja problemas complejos y tareas administrativas. Esto generalmente es más barato que contratar personal de recepción a tiempo completo y te da lo mejor de ambos mundos.`,
    searchKeywordsEs: "comparación, costo, recepcionista, contratar, versus, humana, precio, ahorro",
  },
  {
    slug: "missed-calls-cost-money",
    categorySlug: "for-prospects",
    title: "Why Missed Calls Cost Your Business Real Money",
    sortOrder: 37,
    searchKeywords: "missed calls, revenue, lost business, roi, cost, money, voicemail, statistics",
    relatedArticles: ["capta-vs-receptionist", "first-month-expectations"],
    content: `### The Real Numbers

**62% of service calls go unanswered.** A survey found that 62% of incoming calls to home service businesses aren't answered. This aligns with industry-wide data.

**85% of missed callers don't leave voicemail.** If a caller reaches your voicemail, they'll often just hang up. That caller is now calling your competitor instead.

**78% hire the first business to answer.** Most people call a few service businesses. They book with the first one who picks up—period. If you don't answer, you've lost that job before you even knew it was coming.

### Do the Math: What Are You Losing?

Let's say you're a mid-size contractor:
- 5 missed calls per day (realistic for busy season)
- $300 average job value
- 50% would have booked if you answered

**Daily loss:** 5 calls × 50% × $300 = **$750**

**Monthly loss:** $750 × 21 work days = **$15,750**

**Annual loss:** $15,750 × 12 months = **$189,000**

If you get 10 missed calls per day (common in peak season), that's **$30K+ per month** walking out the door.

### Beyond Direct Lost Revenue

You also lose:
- Reputation damage from frustrated callers
- Emergency calls that go to competitors
- Repeat customers who reach your competitor instead
- Market share as competitors grow faster

### The Solution: Your Receptionist Answers Every Call

With Capta, every call is answered—24/7. She:
- Picks up immediately (no voicemail jail)
- Books appointments automatically
- Qualifies leads if you're fully booked
- Works 24/7 (no missed night calls)
- Costs $497/month

Even if she only converts half of those missed calls into bookings, you're looking at $7,875+ extra revenue per month. That's a 16x return on her $497/month cost.`,
    titleEs: "Por Qué las Llamadas Perdidas le Cuestan Dinero Real a Tu Negocio",
    contentEs: `### Los Números Reales

**62% de las llamadas de servicio no se contestan.** Una encuesta encontró que el 62% de las llamadas entrantes a negocios de servicios del hogar no se responden.

**85% de los que no logran comunicarse no dejan buzón de voz.** Si alguien llega a tu buzón de voz, generalmente cuelgan. Esa persona ahora está llamando a tu competidor.

**78% contratan al primer negocio que contesta.** La mayoría de la gente llama a varios negocios de servicio. Contratan al primero que contesta — punto. Si no contestas, perdiste ese trabajo antes de saber que venía.

### Haz las Cuentas: ¿Cuánto Estás Perdiendo?

Digamos que eres un contratista mediano:
- 5 llamadas perdidas por día (realista en temporada alta)
- $300 valor promedio del trabajo
- 50% habría agendado si hubieras contestado

**Pérdida diaria:** 5 llamadas × 50% × $300 = **$750**

**Pérdida mensual:** $750 × 21 días laborales = **$15,750**

**Pérdida anual:** $15,750 × 12 meses = **$189,000**

Si pierdes 10 llamadas al día (común en temporada alta), eso es **$30K+ por mes** saliendo por la puerta.

### Más Allá de los Ingresos Perdidos Directamente

También pierdes:
- Daño a tu reputación por clientes frustrados
- Llamadas de emergencia que van a competidores
- Clientes recurrentes que llegan a tu competidor
- Participación de mercado mientras los competidores crecen más rápido

### La Solución: Tu Recepcionista Contesta Cada Llamada

Con Capta, cada llamada se contesta — 24/7. Ella:
- Contesta de inmediato (sin buzón de voz)
- Agenda citas automáticamente
- Califica prospectos si estás lleno
- Trabaja 24/7 (sin llamadas nocturnas perdidas)
- Cuesta $497/mes

Incluso si solo convierte la mitad de esas llamadas perdidas en citas, estás viendo $7,875+ de ingresos extra por mes. Eso es un retorno de 16x sobre su costo de $497/mes.`,
    searchKeywordsEs: "llamadas perdidas, ingresos, negocio perdido, roi, costo, dinero, buzón de voz, estadísticas",
  },
  {
    slug: "first-month-expectations",
    categorySlug: "for-prospects",
    title: "What to Expect: Setup to Live in Under an Hour",
    sortOrder: 38,
    searchKeywords: "first month, setup, onboarding, expectations, roi, timeline, getting started, results, how long",
    relatedArticles: ["what-is-capta", "missed-calls-cost-money", "tips-best-results"],
    content: `## Setup: Under an Hour

Capta is designed to go live the same day you sign up. Most contractors finish setup in 30-60 minutes.

### Step 1: Build Your Receptionist (10 minutes)
Walk through the setup wizard: enter your business name, trade, location, and services. Name your receptionist, pick her personality (professional, friendly, or warm), and customize her greeting.

### Step 2: Train Her on Your Business (10 minutes)
Answer a few questions only you know: your hours, service area, whether you offer free estimates, and any topics she should avoid (like pricing or competitor discussions). She already knows your trade — you're just adding the details specific to your business.

### Step 3: Subscribe & Get Your Number (5 minutes)
Choose monthly ($497/mo) or annual ($397/mo). After checkout, Capta automatically provisions a dedicated phone number for your business.

### Step 4: Forward Your Calls (5 minutes)
Set up call forwarding from your existing business line:
- **AT&T:** Dial \`*21*[your Capta number]#\`
- **Verizon:** Dial \`*72 [your Capta number]\`
- **T-Mobile:** Dial \`**21*[your Capta number]#\`
- **Other carriers:** Call your provider and ask for "conditional call forwarding"

### Step 5: Test It (5 minutes)
Call your business number from your personal phone. She answers. Test her — ask about your services, request an estimate, try an emergency scenario. She's live.

**That's it.** She is answering your real calls.

---

## What's Working From Day One

Everything is active immediately — no phased rollout, no waiting periods. Here's what your receptionist does starting with your very first call:

### Every Inbound Call
- Answers with your custom greeting, in English or Spanish (detects automatically)
- Collects caller info, job details, urgency level
- Books appointments based on your availability
- Gives ballpark pricing based on your configured service rates
- Detects emergencies (gas leak, burst pipe, sparking outlet) and transfers to you immediately
- Takes messages and texts you a summary instantly
- Recognizes returning callers by name

### After the Call
- **Job card created** — caller info, job type, description, urgency, all in one place
- **Photo request sent** — She texts the caller asking for photos of the job site. Photos attach to the job card automatically.
- **AI estimate generated** — based on the job details collected, your receptionist creates a price range. You confirm or adjust via text. Customer gets a real number, not "someone will call you back."
- **Owner notification** — you get a text summary. Reply right from your phone: "Book it for Thursday" or "Tell them $2,500" and she follows up with the customer.

### Missed Call Recovery
If a caller hangs up or the line drops, she auto-texts them within 60 seconds to re-engage. Most are recovered before they call your competitor.

### Automated Follow-Ups
- **Estimate follow-ups** — quotes that go cold get automatic follow-up texts and calls. She re-engages: "Hi, we sent you an estimate last week. Would you like to schedule the work?"
- **Customer recall** — past customers who haven't called in a while get proactive outreach: "It's been 12 months since your last AC tune-up — want to schedule your annual maintenance?"
- **Appointment reminders** — customers get automatic reminder calls before their appointments

### Partner Referral Network
When someone calls asking for a service you don't offer (e.g., an electrician calls a plumbing company), she refers them to a trusted partner in your network. They handle the job, you get a referral fee. Revenue from calls that aren't even your trade.

### Google Review Requests
After a completed job, your receptionist automatically asks the customer for a Google review. More reviews = higher rankings = more calls.

---

## Your Dashboard

Your Capta dashboard is live from day one with 20 pages of tools:

- **Overview** — call volume, revenue metrics, booking rate, activity feed
- **Calls** — every call with recording, transcript, AI summary, and quality score
- **Appointments** — upcoming and past, managed in your dashboard
- **Estimates** — Kanban pipeline from new to closed, with one-click follow-up
- **Job Cards** — structured job details with photos, ready for your crew
- **Customers** — auto-populated CRM. Every caller becomes a profile with full history.
- **SMS** — all text conversations in one place
- **Partners** — manage your referral network
- **Import** — CSV upload to bring in your existing customer list
- **Settings** — edit hours, services, greeting, personality, pricing, custom responses, automations
- **Billing** — plan details, invoices, Stripe portal

### Reports That Come to You
- **Daily summary SMS** — quick text every evening with today's call count and action items
- **Weekly digest email** — Monday morning summary: calls, bookings, open estimates, revenue
- **Monthly ROI report** — actual revenue impact with dollar amounts

---

## First Week: What to Watch For

**Day 1-2:** Check your call summaries. See what customers are asking. If callers frequently ask about something you didn't list, add it in Settings.

**Day 3-5:** Review your estimate pipeline. Follow up on any open quotes. Check that SMS alerts are coming through.

**By end of Week 1:** You'll have real data on how many calls you were missing and how much revenue she is recovering. Most contractors are surprised by the numbers.

---

## First Month Results

Average results after 30 days:
- **30-50% increase in booked appointments** — because you're answering calls you were missing
- **Missed calls recovered** — callers who would have gone to your competitor are now in your pipeline
- **Estimates generated and followed up** — no more quotes dying in your voicemail
- **Past customers reactivated** — dormant customers coming back for maintenance and new work
- **Clear ROI** — your dashboard shows exactly what she recovered vs. her $497/month cost

### If Results Are Lower Than Expected

Check these first:
- **Profile incomplete** — add more services, update pricing, refine your greeting
- **Call forwarding not set up correctly** — test by calling your business line
- **Not checking the dashboard** — She books appointments and creates job cards, but you still need to follow up on complex jobs
- **Low call volume market** — you're still capturing every call. The ROI compounds as volume grows.

---

## Get Started

14-day free trial. Full access to everything. Cancel anytime.

**Ready?** Get started at [captahq.com](https://captahq.com).

Need help? Email support@captahq.com or call (830) 521-7133.`,
    titleEs: "Qué Esperar: De la Configuración a en Vivo en Menos de una Hora",
    contentEs: `## Configuración: Menos de una Hora

Capta está diseñado para activarse el mismo día que te registras. La mayoría de los contratistas terminan la configuración en 30-60 minutos.

### Paso 1: Construye Tu Recepcionista (10 minutos)
Sigue el asistente de configuración: ingresa el nombre de tu negocio, oficio, ubicación y servicios. Ponle nombre a tu recepcionista, elige su personalidad (profesional, amigable o cálida) y personaliza su saludo.

### Paso 2: Entrénala sobre Tu Negocio (10 minutos)
Responde unas preguntas que solo tú sabes: tus horarios, área de servicio, si ofreces estimados gratis y cualquier tema que deba evitar (como precios o discusiones sobre competidores). Ella ya conoce tu oficio — solo le agregas los detalles específicos de tu negocio.

### Paso 3: Suscríbete y Obtén Tu Número (5 minutos)
Elige mensual ($497/mes) o anual ($397/mes). Después del pago, Capta automáticamente asigna un número de teléfono dedicado para tu negocio.

### Paso 4: Redirige Tus Llamadas (5 minutos)
Configura el desvío de llamadas desde tu línea de negocio existente:
- **AT&T:** Marca \`*21*[tu número de Capta]#\`
- **Verizon:** Marca \`*72 [tu número de Capta]\`
- **T-Mobile:** Marca \`**21*[tu número de Capta]#\`
- **Otros operadores:** Llama a tu proveedor y pide "desvío de llamadas condicional"

### Paso 5: Pruébalo (5 minutos)
Llama a tu número de negocio desde tu celular personal. Ella contesta. Pruébala — pregunta por tus servicios, pide un estimado, prueba un escenario de emergencia. Está en vivo.

**Eso es todo.** Ella está contestando tus llamadas reales.

---

## Lo Que Funciona Desde el Día Uno

Todo está activo de inmediato — sin implementación por fases, sin períodos de espera. Esto es lo que hace tu recepcionista desde tu primera llamada:

### Cada Llamada Entrante
- Contesta con tu saludo personalizado, en inglés o español (detecta automáticamente)
- Recopila datos del cliente, detalles del trabajo, nivel de urgencia
- Agenda citas según tu disponibilidad
- Da precios aproximados según tus tarifas configuradas
- Detecta emergencias (fuga de gas, tubería rota, cortocircuito) y te transfiere de inmediato
- Toma mensajes y te envía un resumen por texto al instante
- Reconoce clientes recurrentes por nombre

### Después de la Llamada
- **Tarjeta de trabajo creada** — datos del cliente, tipo de trabajo, descripción, urgencia, todo en un solo lugar
- **Solicitud de fotos enviada** — Ella le envía un texto al cliente pidiendo fotos del sitio de trabajo. Las fotos se adjuntan automáticamente a la tarjeta de trabajo.
- **Estimado IA generado** — basado en los detalles recopilados, tu recepcionista crea un rango de precios. Tú confirmas o ajustas por texto. El cliente recibe un número real, no "alguien te llamará."
- **Notificación al dueño** — recibes un resumen por texto. Responde desde tu teléfono: "Agéndalo para el jueves" o "Diles $2,500" y ella da seguimiento con el cliente.

### Recuperación de Llamadas Perdidas
Si alguien cuelga o se cae la línea, ella le envía un texto automático en 60 segundos para re-engancharlo. La mayoría se recuperan antes de que llamen a tu competidor.

### Seguimientos Automáticos
- **Seguimiento de estimados** — cotizaciones que se enfrían reciben textos y llamadas automáticas de seguimiento. Ella re-engancha: "Hola, te enviamos un estimado la semana pasada. ¿Te gustaría agendar el trabajo?"
- **Reactivación de clientes** — clientes pasados que no han llamado en un tiempo reciben contacto proactivo: "Han pasado 12 meses desde tu último mantenimiento de AC — ¿quieres agendar tu mantenimiento anual?"
- **Recordatorios de citas** — los clientes reciben llamadas automáticas de recordatorio antes de sus citas

### Red de Referidos de Socios
Cuando alguien llama pidiendo un servicio que no ofreces (ej., un electricista llama a una empresa de plomería), ella los refiere a un socio de confianza en tu red. Ellos hacen el trabajo, tú recibes una comisión de referido. Ingresos de llamadas que ni siquiera son de tu oficio.

### Solicitudes de Reseñas en Google
Después de un trabajo completado, tu recepcionista automáticamente le pide al cliente una reseña en Google. Más reseñas = mejor posicionamiento = más llamadas.

---

## Tu Panel de Control

Tu panel de Capta está activo desde el día uno con 20 páginas de herramientas:

- **Resumen** — volumen de llamadas, métricas de ingresos, tasa de reservaciones, actividad reciente
- **Llamadas** — cada llamada con grabación, transcripción, resumen IA y puntaje de calidad
- **Citas** — próximas y pasadas, administradas en tu panel
- **Estimados** — pipeline Kanban de nuevo a cerrado, con seguimiento de un clic
- **Tarjetas de Trabajo** — detalles estructurados con fotos, listos para tu equipo
- **Clientes** — CRM auto-poblado. Cada persona que llama se convierte en un perfil con historial completo.
- **SMS** — todas las conversaciones de texto en un solo lugar
- **Socios** — administra tu red de referidos
- **Importar** — carga CSV para traer tu lista de clientes existente
- **Configuración** — edita horarios, servicios, saludo, personalidad, precios, respuestas personalizadas, automatizaciones
- **Facturación** — detalles del plan, facturas, portal de Stripe

### Reportes Que Te Llegan
- **Resumen diario por SMS** — texto rápido cada noche con el conteo de llamadas del día y tareas pendientes
- **Resumen semanal por email** — resumen del lunes por la mañana: llamadas, reservaciones, estimados abiertos, ingresos
- **Reporte mensual de ROI** — impacto real en ingresos con cantidades en dólares

---

## Primera Semana: Qué Observar

**Día 1-2:** Revisa tus resúmenes de llamadas. Ve qué están preguntando los clientes. Si preguntan frecuentemente por algo que no listaste, agrégalo en Configuración.

**Día 3-5:** Revisa tu pipeline de estimados. Da seguimiento a cotizaciones abiertas. Verifica que las alertas SMS estén llegando.

**Al final de la Semana 1:** Tendrás datos reales de cuántas llamadas estabas perdiendo y cuántos ingresos ella está recuperando. La mayoría de los contratistas se sorprenden con los números.

---

## Resultados del Primer Mes

Resultados promedio después de 30 días:
- **30-50% de aumento en citas agendadas** — porque estás contestando llamadas que estabas perdiendo
- **Llamadas perdidas recuperadas** — personas que se habrían ido con tu competidor ahora están en tu pipeline
- **Estimados generados y con seguimiento** — sin más cotizaciones muriendo en tu buzón de voz
- **Clientes pasados reactivados** — clientes inactivos regresando por mantenimiento y trabajo nuevo
- **ROI claro** — tu panel muestra exactamente lo que ella recuperó vs. su costo de $497/mes

### Si los Resultados Son Menores de lo Esperado

Revisa esto primero:
- **Perfil incompleto** — agrega más servicios, actualiza precios, refina tu saludo
- **Desvío de llamadas mal configurado** — prueba llamando a tu línea de negocio
- **No revisas el panel** — ella agenda citas y crea tarjetas de trabajo, pero tú aún necesitas dar seguimiento a trabajos complejos
- **Mercado con bajo volumen de llamadas** — aún estás capturando cada llamada. El ROI se acumula conforme crece el volumen.

---

## Empieza Ya

Prueba gratuita de 14 días. Acceso completo a todo. Cancela cuando quieras.

**¿Listo?** Empieza en [captahq.com](https://captahq.com).

¿Necesitas ayuda? Escríbenos a support@captahq.com o llama al (830) 521-7133.`,
    searchKeywordsEs: "primer mes, configuración, onboarding, expectativas, roi, cronograma, primeros pasos, resultados, cuánto tiempo",
  },

  // ── New Feature Articles ──
  {
    slug: "intelligence-dashboard",
    categorySlug: "features-tips",
    title: "Understanding the Intelligence Dashboard",
    sortOrder: 39,
    searchKeywords: "intelligence, brain, qa score, knowledge gaps, customer tiers, quality, trends, insights",
    dashboardContextRoutes: ["/dashboard/intelligence"],
    relatedArticles: ["monthly-report", "improve-maria-responses", "tips-best-results"],
    content: `The Intelligence page shows you how your receptionist is learning and improving over time.

### What You'll See

**Knowledge Mastery**
A summary of everything your receptionist knows: FAQs she can answer, custom phrases, emergency keywords, and off-limits topics. If callers ask something she can't answer, it appears as a knowledge gap. Fill the gap once and she never misses that question again.

**Quality Trends**
Every call gets scored on six dimensions:
- Greeting quality
- Language match
- Need capture
- Action taken
- Accuracy
- Caller sentiment

Scores are tracked weekly so you can see improvement over time.

**Customer Intelligence**
Your receptionist builds profiles for every caller. Over time, she segments them into tiers:
- **Hot** — Active leads likely to book
- **Warm** — Interested but not yet committed
- **Cold** — Low engagement
- **Dormant** — Haven't called in a while

**Business Insights**
- Most requested services
- Busiest call hours (24-hour heatmap)
- Bilingual call percentage
- Monthly call volume trends

### How to Use This Data

- Check knowledge gaps weekly and fill them in Settings → Custom Responses
- Monitor QA scores to see if greeting or accuracy needs improvement
- Use customer tiers to prioritize follow-ups on hot leads
- Review busiest hours to plan your schedule around peak call times`,
    titleEs: "Entendiendo el Panel de Inteligencia",
    contentEs: `La página de Inteligencia te muestra cómo tu recepcionista está aprendiendo y mejorando con el tiempo.

### Qué Verás

**Dominio del Conocimiento**
Un resumen de todo lo que sabe tu recepcionista: preguntas frecuentes que puede responder, frases personalizadas, palabras clave de emergencia y temas prohibidos. Si alguien pregunta algo que no puede responder, aparece como una brecha de conocimiento. Llena la brecha una vez y nunca falla esa pregunta otra vez.

**Tendencias de Calidad**
Cada llamada se califica en seis dimensiones:
- Calidad del saludo
- Coincidencia de idioma
- Captura de necesidad
- Acción tomada
- Precisión
- Sentimiento del cliente

Los puntajes se rastrean semanalmente para que veas la mejora con el tiempo.

**Inteligencia de Clientes**
Tu recepcionista crea perfiles para cada persona que llama. Con el tiempo, los segmenta en niveles:
- **Caliente** — Prospectos activos con probabilidad de agendar
- **Tibio** — Interesados pero no comprometidos
- **Frío** — Bajo engagement
- **Inactivo** — No han llamado en un tiempo

**Insights del Negocio**
- Servicios más solicitados
- Horas de llamadas más ocupadas (mapa de calor de 24 horas)
- Porcentaje de llamadas bilingües
- Tendencias de volumen mensual de llamadas

### Cómo Usar Estos Datos

- Revisa las brechas de conocimiento semanalmente y llénalas en Configuración → Respuestas Personalizadas
- Monitorea los puntajes de calidad para ver si el saludo o la precisión necesitan mejora
- Usa los niveles de clientes para priorizar seguimientos con prospectos calientes
- Revisa las horas más ocupadas para planificar tu agenda alrededor de los horarios pico`,
    searchKeywordsEs: "inteligencia, cerebro, puntaje qa, brechas de conocimiento, niveles de clientes, calidad, tendencias, insights",
  },
  {
    slug: "revenue-attribution",
    categorySlug: "features-tips",
    title: "Revenue Attribution — See What Your Receptionist Earns",
    sortOrder: 40,
    searchKeywords: "revenue, roi, money, earned, saved, attribution, cost per lead, after hours, bilingual",
    dashboardContextRoutes: ["/dashboard"],
    relatedArticles: ["monthly-report", "intelligence-dashboard"],
    content: `Your dashboard overview now shows exactly how much revenue your receptionist is generating.

### Revenue Banner

At the top of your Overview page, you'll see:
- **Revenue This Month** — Total estimated revenue from appointments booked
- **ROI Multiple** — How many times over your receptionist pays for herself
- **Cost Per Lead** — Average cost to acquire each new customer through Capta

### How Revenue Is Calculated

Revenue attribution is based on real data from your account:
- **Appointments booked** × your average job value = direct revenue
- **After-hours calls answered** = missed-call recovery value
- **Bilingual calls served** = customers you would have lost without Spanish support

### The "Saved You" Breakdown

The breakdown card shows three categories:
1. **Missed calls recovered** — Calls answered when you couldn't pick up
2. **After-hours captures** — Nights, weekends, and holiday calls
3. **Bilingual customers served** — Spanish-speaking callers handled seamlessly

### Setting Your Average Job Value

For the most accurate revenue numbers, set your average job value in **Settings → Business Profile → Trade Information**. If you haven't set one, we use a default based on your trade (e.g., $350 for plumbing, $450 for HVAC).`,
    titleEs: "Atribución de Ingresos — Ve Lo Que Gana Tu Recepcionista",
    contentEs: `Tu panel de resumen ahora muestra exactamente cuántos ingresos está generando tu recepcionista.

### Banner de Ingresos

En la parte superior de tu página de Resumen, verás:
- **Ingresos Este Mes** — Ingresos estimados totales de citas agendadas
- **Múltiplo de ROI** — Cuántas veces se paga sola tu recepcionista
- **Costo Por Prospecto** — Costo promedio para adquirir cada nuevo cliente a través de Capta

### Cómo Se Calculan los Ingresos

La atribución de ingresos se basa en datos reales de tu cuenta:
- **Citas agendadas** × tu valor promedio de trabajo = ingresos directos
- **Llamadas fuera de horario contestadas** = valor de recuperación de llamadas perdidas
- **Llamadas bilingües atendidas** = clientes que habrías perdido sin soporte en español

### El Desglose "Te Ahorró"

La tarjeta de desglose muestra tres categorías:
1. **Llamadas perdidas recuperadas** — Llamadas contestadas cuando no podías atender
2. **Capturas fuera de horario** — Noches, fines de semana y llamadas en días festivos
3. **Clientes bilingües atendidos** — Clientes hispanohablantes manejados sin problemas

### Configurar Tu Valor Promedio de Trabajo

Para los números de ingresos más precisos, configura tu valor promedio de trabajo en **Configuración → Perfil de Negocio → Información del Oficio**. Si no has configurado uno, usamos un valor predeterminado según tu oficio (ej., $350 para plomería, $450 para HVAC).`,
    searchKeywordsEs: "ingresos, roi, dinero, ganado, ahorrado, atribución, costo por prospecto, fuera de horario, bilingüe",
  },
  {
    slug: "data-export",
    categorySlug: "billing-account",
    title: "Exporting Your Data",
    sortOrder: 41,
    searchKeywords: "export, csv, download, data, customers, calls, appointments, backup",
    dashboardContextRoutes: ["/dashboard/settings"],
    relatedArticles: ["data-protection", "cancellation-policy"],
    content: `You can export your data at any time as CSV files.

### What You Can Export

- **Customers** — Name, phone, email, address, tier, total calls, notes
- **Calls** — Date, duration, caller info, outcome, sentiment, summary
- **Appointments** — Date, time, service, customer, status

### How to Export

1. Go to the page you want to export (Customers, Calls, or Appointments)
2. Look for the **Export CSV** button in the top-right area
3. Click it to download a CSV file with all your data
4. Open the file in Excel, Google Sheets, or any spreadsheet app

### Tips

- Export before canceling your account to keep your records
- Use customer exports to import into another CRM if needed
- Call exports include AI summaries — useful for reviewing patterns
- Exports include all records, not just the current page or filter`,
    titleEs: "Exportar Tus Datos",
    contentEs: `Puedes exportar tus datos en cualquier momento como archivos CSV.

### Qué Puedes Exportar

- **Clientes** — Nombre, teléfono, email, dirección, nivel, total de llamadas, notas
- **Llamadas** — Fecha, duración, información del cliente, resultado, sentimiento, resumen
- **Citas** — Fecha, hora, servicio, cliente, estado

### Cómo Exportar

1. Ve a la página que quieres exportar (Clientes, Llamadas o Citas)
2. Busca el botón **Exportar CSV** en la esquina superior derecha
3. Haz clic para descargar un archivo CSV con todos tus datos
4. Abre el archivo en Excel, Google Sheets o cualquier app de hojas de cálculo

### Consejos

- Exporta antes de cancelar tu cuenta para conservar tus registros
- Usa las exportaciones de clientes para importar en otro CRM si lo necesitas
- Las exportaciones de llamadas incluyen resúmenes IA — útiles para revisar patrones
- Las exportaciones incluyen todos los registros, no solo la página o filtro actual`,
    searchKeywordsEs: "exportar, csv, descargar, datos, clientes, llamadas, citas, respaldo",
  },
  {
    slug: "customer-merge",
    categorySlug: "managing-calls",
    title: "Merging Duplicate Customers",
    sortOrder: 42,
    searchKeywords: "merge, duplicate, combine, customer, contact, clean up, database",
    dashboardContextRoutes: ["/dashboard/customers"],
    relatedArticles: ["understanding-call-logs"],
    content: `Sometimes the same customer calls from different numbers or gives a slightly different name. This creates duplicate entries. You can merge them.

### How to Merge Customers

1. Go to **Customers** in your dashboard
2. Find the duplicate profiles
3. Open one of them and click **Merge with another customer**
4. Search for and select the other profile
5. Choose which name, phone, and email to keep as primary
6. Click **Merge**

### What Happens When You Merge

All records from both profiles are combined:
- Call history from both profiles appears under one customer
- Appointments are consolidated
- Messages and notes are merged
- The customer's tier and lead score are recalculated

The duplicate profile is removed and all future calls from either number are attributed to the merged profile.

### Tips

- Review your customer list periodically for duplicates
- Look for similar names or the same phone number
- Merging cannot be undone — double-check before confirming`,
    titleEs: "Fusionar Clientes Duplicados",
    contentEs: `A veces el mismo cliente llama desde diferentes números o da un nombre ligeramente diferente. Esto crea entradas duplicadas. Puedes fusionarlas.

### Cómo Fusionar Clientes

1. Ve a **Clientes** en tu panel
2. Encuentra los perfiles duplicados
3. Abre uno de ellos y haz clic en **Fusionar con otro cliente**
4. Busca y selecciona el otro perfil
5. Elige qué nombre, teléfono y email mantener como principal
6. Haz clic en **Fusionar**

### Qué Pasa Cuando Fusionas

Todos los registros de ambos perfiles se combinan:
- El historial de llamadas de ambos perfiles aparece bajo un solo cliente
- Las citas se consolidan
- Los mensajes y notas se fusionan
- El nivel y puntaje del cliente se recalculan

El perfil duplicado se elimina y todas las llamadas futuras desde cualquiera de los números se atribuyen al perfil fusionado.

### Consejos

- Revisa tu lista de clientes periódicamente buscando duplicados
- Busca nombres similares o el mismo número de teléfono
- La fusión no se puede deshacer — verifica bien antes de confirmar`,
    searchKeywordsEs: "fusionar, duplicado, combinar, cliente, contacto, limpiar, base de datos",
  },
  {
    slug: "lead-scoring",
    categorySlug: "features-tips",
    title: "Understanding Lead Scores and Customer Tiers",
    sortOrder: 43,
    searchKeywords: "lead score, tier, hot, warm, cold, dormant, priority, scoring, customer value",
    dashboardContextRoutes: ["/dashboard/customers"],
    relatedArticles: ["intelligence-dashboard", "customer-merge"],
    content: `Every customer in your CRM gets an automatic lead score from 0 to 100. This score determines their tier and helps you prioritize follow-ups.

### How Scoring Works

Lead scores are calculated daily based on:
- **Call frequency** — How often they call
- **Recency** — How recently they last called
- **Engagement** — Whether they booked appointments, responded to texts
- **Job value** — Estimated revenue from their requests

### Customer Tiers

Based on their lead score, customers are grouped into tiers:

- **Hot (75-100)** — Active leads. These customers are ready to book. Follow up immediately.
- **Warm (50-74)** — Interested prospects. They've called recently but haven't committed. A follow-up text or call can close them.
- **Cold (25-49)** — Low engagement. They called once or twice but haven't responded. Worth a periodic check-in.
- **Dormant (0-24)** — Inactive. Haven't called in months. Good candidates for reactivation campaigns.

### Using Tiers Effectively

- Filter your customer list by tier to focus on hot leads first
- Review warm leads weekly — a quick follow-up can convert them
- Set up automated follow-ups for cold leads
- Use dormant customers for seasonal reactivation ("It's been 12 months since your last service...")

### Where to See Scores

Lead scores and tiers appear on each customer's profile card and in the customer list. You can sort and filter by tier in the Customers page.`,
    titleEs: "Entendiendo Puntajes de Prospectos y Niveles de Clientes",
    contentEs: `Cada cliente en tu CRM recibe un puntaje automático de prospecto del 0 al 100. Este puntaje determina su nivel y te ayuda a priorizar seguimientos.

### Cómo Funciona el Puntaje

Los puntajes de prospectos se calculan diariamente basándose en:
- **Frecuencia de llamadas** — Qué tan seguido llaman
- **Recencia** — Qué tan recientemente llamaron por última vez
- **Engagement** — Si agendaron citas, respondieron textos
- **Valor del trabajo** — Ingresos estimados de sus solicitudes

### Niveles de Clientes

Basándose en su puntaje, los clientes se agrupan en niveles:

- **Caliente (75-100)** — Prospectos activos. Listos para agendar. Haz seguimiento de inmediato.
- **Tibio (50-74)** — Interesados pero no comprometidos. Un texto o llamada de seguimiento puede cerrarlos.
- **Frío (25-49)** — Bajo engagement. Llamaron una o dos veces pero no respondieron. Vale un contacto periódico.
- **Inactivo (0-24)** — Sin actividad en meses. Buenos candidatos para campañas de reactivación.

### Usando los Niveles Efectivamente

- Filtra tu lista de clientes por nivel para enfocarte en prospectos calientes primero
- Revisa prospectos tibios semanalmente — un seguimiento rápido puede convertirlos
- Configura seguimientos automáticos para prospectos fríos
- Usa clientes inactivos para reactivación estacional ("Han pasado 12 meses desde tu último servicio...")

### Dónde Ver los Puntajes

Los puntajes y niveles aparecen en la tarjeta de perfil de cada cliente y en la lista de clientes. Puedes ordenar y filtrar por nivel en la página de Clientes.`,
    searchKeywordsEs: "puntaje de prospecto, nivel, caliente, tibio, frío, inactivo, prioridad, puntuación, valor del cliente",
  },
  {
    slug: "dispatch-technicians",
    categorySlug: "features-tips",
    title: "Dispatch and Technician Management",
    sortOrder: 44,
    searchKeywords: "dispatch, technician, assign, skill, availability, crew, team, schedule",
    dashboardContextRoutes: ["/dashboard/appointments"],
    relatedArticles: ["appointments-booked-tracked"],
    content: `If you have a team of technicians, you can manage dispatch directly from your Capta dashboard.

### Quick-Assign from Appointments

When viewing an appointment, click **Assign Technician** to assign a team member. You'll see:
- Available technicians for that time slot
- Their skill tags (e.g., "HVAC", "Plumbing", "Electrical")
- Whether they're already booked

### Skill Matching

Each technician can have skill tags. When assigning, Capta highlights technicians whose skills match the service requested. This prevents sending a plumber to an electrical job.

### Setting Up Technicians

1. Go to **Settings → Team**
2. Add your technicians with their name, phone number, and skill tags
3. Set their availability hours
4. Mark any time-off or unavailable periods

### Technician Notifications

When you assign a technician, they get an SMS with the job details:
- Customer name and phone
- Service requested
- Date, time, and address
- Any special notes from the call

### Bulk Actions

In the Appointments page, you can select multiple appointments and:
- Assign them all to one technician
- Change their status (confirm, cancel, complete)
- Export the selected appointments`,
    titleEs: "Despacho y Gestión de Técnicos",
    contentEs: `Si tienes un equipo de técnicos, puedes gestionar el despacho directamente desde tu panel de Capta.

### Asignación Rápida desde Citas

Al ver una cita, haz clic en **Asignar Técnico** para asignar un miembro del equipo. Verás:
- Técnicos disponibles para ese horario
- Sus etiquetas de habilidades (ej., "HVAC", "Plomería", "Electricidad")
- Si ya están ocupados

### Coincidencia de Habilidades

Cada técnico puede tener etiquetas de habilidades. Al asignar, Capta resalta a los técnicos cuyas habilidades coinciden con el servicio solicitado. Esto evita enviar a un plomero a un trabajo eléctrico.

### Configurar Técnicos

1. Ve a **Configuración → Equipo**
2. Agrega tus técnicos con su nombre, número de teléfono y etiquetas de habilidades
3. Configura sus horarios de disponibilidad
4. Marca cualquier período de descanso o no disponibilidad

### Notificaciones a Técnicos

Cuando asignas un técnico, recibe un SMS con los detalles del trabajo:
- Nombre y teléfono del cliente
- Servicio solicitado
- Fecha, hora y dirección
- Cualquier nota especial de la llamada

### Acciones Masivas

En la página de Citas, puedes seleccionar múltiples citas y:
- Asignarlas todas a un técnico
- Cambiar su estado (confirmar, cancelar, completar)
- Exportar las citas seleccionadas`,
    searchKeywordsEs: "despacho, técnico, asignar, habilidad, disponibilidad, equipo, cuadrilla, agenda",
  },
  {
    slug: "estimates-pipeline",
    categorySlug: "features-tips",
    title: "Managing Estimates and Follow-Ups",
    sortOrder: 45,
    searchKeywords: "estimates, quotes, pricing, pipeline, follow up, kanban, approve, send, status",
    dashboardContextRoutes: ["/dashboard/estimates", "/dashboard/follow-ups"],
    relatedArticles: ["how-maria-handles-calls", "revenue-attribution"],
    content: `Your receptionist collects job details during calls and generates price range estimates based on your configured rates. You manage these from the Estimates page.

### How Estimates Work

1. Caller describes their problem during the call
2. Your receptionist collects job details — problem type, property info, urgency
3. An estimate with a price range is generated based on your pricing rules
4. You receive a text with the estimate for one-tap approval
5. Once approved, the customer gets a text with the real number

### The Estimates Pipeline

Your Estimates page uses a Kanban-style pipeline:
- **New** — Freshly generated estimates awaiting your review
- **Sent** — Approved and sent to the customer
- **Accepted** — Customer accepted the estimate
- **Declined** — Customer declined
- **Expired** — No response within your configured window

### Follow-Ups

The Follow-Ups page shows estimates and leads that need attention. Your receptionist can automatically follow up on cold estimates with texts like "Hi, we sent you an estimate last week. Would you like to schedule the work?"

### Tips

- Review new estimates daily — speed wins jobs
- Set your pricing ranges in **Settings → Services** so estimates are accurate
- Use the follow-up system instead of manually chasing quotes`,
    titleEs: "Administrando Estimados y Seguimientos",
    contentEs: `Tu recepcionista recopila detalles del trabajo durante las llamadas y genera estimados con rangos de precio basados en tus tarifas configuradas. Los administras desde la página de Estimados.

### Cómo Funcionan los Estimados

1. La persona describe su problema durante la llamada
2. Tu recepcionista recopila detalles del trabajo — tipo de problema, información de la propiedad, urgencia
3. Se genera un estimado con rango de precios basado en tus reglas de precios
4. Recibes un texto con el estimado para aprobación con un toque
5. Una vez aprobado, el cliente recibe un texto con el número real

### El Pipeline de Estimados

Tu página de Estimados usa un pipeline estilo Kanban:
- **Nuevo** — Estimados recién generados esperando tu revisión
- **Enviado** — Aprobados y enviados al cliente
- **Aceptado** — El cliente aceptó el estimado
- **Rechazado** — El cliente rechazó
- **Expirado** — Sin respuesta dentro de tu ventana configurada

### Seguimientos

La página de Seguimientos muestra estimados y prospectos que necesitan atención. Tu recepcionista puede hacer seguimiento automático a estimados fríos con textos como "Hola, te enviamos un estimado la semana pasada. ¿Te gustaría agendar el trabajo?"

### Consejos

- Revisa nuevos estimados diariamente — la velocidad gana trabajos
- Configura tus rangos de precios en **Configuración → Servicios** para que los estimados sean precisos
- Usa el sistema de seguimiento en vez de perseguir cotizaciones manualmente`,
    searchKeywordsEs: "estimados, cotizaciones, precios, pipeline, seguimiento, kanban, aprobar, enviar, estado",
  },
  {
    slug: "job-cards",
    categorySlug: "features-tips",
    title: "Understanding Job Cards",
    sortOrder: 46,
    searchKeywords: "job cards, work orders, photos, details, crew, field, dispatch, job site",
    dashboardContextRoutes: ["/dashboard/job-cards"],
    relatedArticles: ["estimates-pipeline", "dispatch-technicians"],
    content: `Job cards are structured records created from every call where a service is requested. They give you and your crew everything needed to do the job.

### What's on a Job Card

- **Customer info** — Name, phone, address
- **Job type** — Service category and description
- **Urgency** — Low, medium, high, or emergency
- **Photos** — After the call, your receptionist texts the customer asking for photos of the job site. Photos attach to the card automatically.
- **Notes** — Details from the call transcript
- **Estimate** — Price range if one was generated

### How Job Cards Are Created

When your receptionist handles a call that involves a service request, a job card is created automatically. No manual data entry needed.

### Using Job Cards

- **Dispatch to crew** — Assign a technician directly from the job card
- **Review before arriving** — Your crew sees the problem description and photos before they get to the site
- **Track status** — Mark jobs as scheduled, in progress, or completed
- **Link to invoice** — Connect the job card to an invoice after completion`,
    titleEs: "Entendiendo las Tarjetas de Trabajo",
    contentEs: `Las tarjetas de trabajo son registros estructurados creados de cada llamada donde se solicita un servicio. Te dan a ti y a tu equipo todo lo necesario para hacer el trabajo.

### Qué Contiene una Tarjeta de Trabajo

- **Datos del cliente** — Nombre, teléfono, dirección
- **Tipo de trabajo** — Categoría de servicio y descripción
- **Urgencia** — Baja, media, alta o emergencia
- **Fotos** — Después de la llamada, tu recepcionista le envía un texto al cliente pidiendo fotos del sitio. Las fotos se adjuntan automáticamente a la tarjeta.
- **Notas** — Detalles de la transcripción de la llamada
- **Estimado** — Rango de precios si se generó uno

### Cómo Se Crean las Tarjetas de Trabajo

Cuando tu recepcionista maneja una llamada que involucra una solicitud de servicio, se crea una tarjeta de trabajo automáticamente. Sin entrada manual de datos.

### Usando Tarjetas de Trabajo

- **Despacha a tu equipo** — Asigna un técnico directamente desde la tarjeta
- **Revisa antes de llegar** — Tu equipo ve la descripción del problema y fotos antes de llegar al sitio
- **Rastrea el estado** — Marca trabajos como programados, en progreso o completados
- **Vincula a factura** — Conecta la tarjeta de trabajo a una factura después de completar`,
    searchKeywordsEs: "tarjetas de trabajo, órdenes de trabajo, fotos, detalles, equipo, campo, despacho, sitio",
  },
  {
    slug: "feedback-and-surveys",
    categorySlug: "features-tips",
    title: "Customer Feedback and Surveys",
    sortOrder: 47,
    searchKeywords: "feedback, survey, nps, satisfaction, review, rating, customer opinion",
    dashboardContextRoutes: ["/dashboard/feedback"],
    relatedArticles: ["nps-health-score", "monthly-report"],
    content: `Capta automatically collects customer feedback after calls and completed appointments. You can view all feedback in the Feedback page.

### How Feedback Is Collected

After certain interactions, customers receive a short follow-up survey asking about their experience. Responses are stored in your dashboard.

### What You See

- **Rating** — Customer satisfaction score
- **Comments** — Written feedback from customers
- **Date** — When the feedback was submitted
- **Source** — Which call or appointment triggered the survey

### Using Feedback

- **Identify patterns** — If multiple customers mention the same issue, address it
- **Celebrate wins** — High ratings mean your receptionist is performing well
- **Improve responses** — Low ratings on specific topics? Update your FAQ or business profile
- **Request reviews** — After completed jobs, Capta automatically asks happy customers for Google reviews`,
    titleEs: "Retroalimentación y Encuestas de Clientes",
    contentEs: `Capta recopila automáticamente retroalimentación de clientes después de llamadas y citas completadas. Puedes ver toda la retroalimentación en la página de Feedback.

### Cómo Se Recopila la Retroalimentación

Después de ciertas interacciones, los clientes reciben una encuesta corta de seguimiento preguntando sobre su experiencia. Las respuestas se guardan en tu panel.

### Qué Ves

- **Calificación** — Puntaje de satisfacción del cliente
- **Comentarios** — Retroalimentación escrita de clientes
- **Fecha** — Cuándo se envió la retroalimentación
- **Fuente** — Qué llamada o cita generó la encuesta

### Usando la Retroalimentación

- **Identifica patrones** — Si varios clientes mencionan el mismo problema, atiéndelo
- **Celebra los logros** — Calificaciones altas significan que tu recepcionista está funcionando bien
- **Mejora las respuestas** — ¿Calificaciones bajas en temas específicos? Actualiza tus FAQ o perfil de negocio
- **Solicita reseñas** — Después de trabajos completados, Capta automáticamente pide a los clientes satisfechos reseñas en Google`,
    searchKeywordsEs: "retroalimentación, encuesta, nps, satisfacción, reseña, calificación, opinión del cliente",
  },
];

async function seed(req: NextRequest) {
  if (!verifySeedAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const force = req.nextUrl.searchParams.get("force") === "1";

    // Check if already seeded
    const [existing] = await db.select({ c: count() }).from(helpArticles);
    if (existing.c > 0 && !force) {
      return NextResponse.json({ message: "Already seeded. Use ?force=1 to replace.", articles: existing.c });
    }

    // Wipe existing articles if re-seeding
    if (existing.c > 0) {
      await db.run(sql`DELETE FROM help_articles`);
    }

    // Seed categories (idempotent)
    const [catCount] = await db.select({ c: count() }).from(helpCategories);
    if (catCount.c === 0) {
      await db.insert(helpCategories).values(SEED_CATEGORIES);
    }

    // Build category slug → id map
    const cats = await db.select({ id: helpCategories.id, slug: helpCategories.slug }).from(helpCategories);
    const catMap = new Map(cats.map((c) => [c.slug, c.id]));

    // Insert all articles
    const now = new Date().toISOString();
    const values = ARTICLES.map((a) => {
      const categoryId = catMap.get(a.categorySlug);
      if (!categoryId) throw new Error(`Category not found: ${a.categorySlug}`);

      // Auto-generate excerpt from first paragraph
      const firstPara = a.content.split("\n\n")[0]?.replace(/[*#\[\]]/g, "").trim() ?? "";
      const excerpt = firstPara.length > 200 ? firstPara.slice(0, 197) + "..." : firstPara;

      // Auto-calculate reading time
      const wordCount = a.content.trim().split(/\s+/).length;
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

      // Auto-generate Spanish excerpt from first paragraph
      const firstParaEs = a.contentEs?.split("\n\n")[0]?.replace(/[*#\[\]]/g, "").trim() ?? "";
      const excerptEs = firstParaEs.length > 200 ? firstParaEs.slice(0, 197) + "..." : firstParaEs || null;

      return {
        categoryId,
        slug: a.slug,
        title: a.title,
        content: a.content,
        excerpt,
        searchKeywords: a.searchKeywords,
        dashboardContextRoutes: a.dashboardContextRoutes ?? null,
        relatedArticles: a.relatedArticles ?? null,
        status: "published" as const,
        sortOrder: a.sortOrder,
        readingTimeMinutes,
        publishedAt: now,
        titleEs: a.titleEs ?? null,
        contentEs: a.contentEs ?? null,
        excerptEs,
        searchKeywordsEs: a.searchKeywordsEs ?? null,
      };
    });

    await db.insert(helpArticles).values(values);

    // Update article counts on categories
    for (const [, id] of catMap) {
      const [artCount] = await db
        .select({ c: count() })
        .from(helpArticles)
        .where(eq(helpArticles.categoryId, id));
      await db
        .update(helpCategories)
        .set({ articleCount: artCount.c })
        .where(eq(helpCategories.id, id));
    }

    return NextResponse.json({
      success: true,
      categories: cats.length,
      articles: values.length,
      slugs: values.map((v) => v.slug),
    });
  } catch (error) {
    reportError("Help seed error", error);
    return NextResponse.json(
      { error: "Seed failed", detail: String(error) },
      { status: 500 },
    );
  }
}

// Support GET for easy browser-based reseeding
export async function GET(req: NextRequest) {
  return seed(req);
}

export async function POST(req: NextRequest) {
  return seed(req);
}
