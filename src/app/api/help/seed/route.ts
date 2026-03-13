import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

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
/*  Seeds 6 help categories + 28 articles from vault content  */
/* ────────────────────────────────────────────────────────── */

const SEED_CATEGORIES = [
  { slug: "getting-started", name: "Getting Started", nameEs: "Primeros Pasos", description: "Set up your account and get Maria answering calls", descriptionEs: "Configura tu cuenta y pon a María a contestar llamadas", icon: "🚀", sortOrder: 1 },
  { slug: "managing-calls", name: "Managing Calls", nameEs: "Administrar Llamadas", description: "Understand how Maria handles your calls day to day", descriptionEs: "Entiende cómo María maneja tus llamadas día a día", icon: "📞", sortOrder: 2 },
  { slug: "billing-account", name: "Billing & Account", nameEs: "Facturación y Cuenta", description: "Payments, invoices, and subscription management", descriptionEs: "Pagos, facturas y gestión de suscripción", icon: "💳", sortOrder: 3 },
  { slug: "troubleshooting", name: "Troubleshooting", nameEs: "Solución de Problemas", description: "Fix common issues and get back on track", descriptionEs: "Resuelve problemas comunes y vuelve a la normalidad", icon: "🔧", sortOrder: 4 },
  { slug: "features-tips", name: "Features & Tips", nameEs: "Funciones y Consejos", description: "Get the most out of Capta and Maria", descriptionEs: "Aprovecha al máximo Capta y María", icon: "⭐", sortOrder: 5 },
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
}

const ARTICLES: ArticleSeed[] = [
  // ── Getting Started (1 article) ──
  {
    slug: "what-is-capta",
    categorySlug: "getting-started",
    title: "What Is Capta and How Does Maria Work?",
    sortOrder: 1,
    searchKeywords: "capta, maria, ai receptionist, how it works, setup, getting started, bilingual, scheduling, 24/7",
    dashboardContextRoutes: ["/dashboard"],
    relatedArticles: ["how-maria-handles-calls", "tips-best-results", "first-month-expectations"],
    content: `Capta is an AI-powered receptionist service for home service businesses. Instead of missing calls or paying someone to answer the phone, Maria—our AI receptionist—handles incoming calls 24/7, even when you're on a job site or helping customers.

## How Maria Works

Maria is not a robotic phone menu. She sounds like a real person and has natural conversations with your callers.

### What Maria Does

- **Answers calls immediately** — No voicemail jail, no waiting on hold
- **Books appointments** — Maria checks your calendar and schedules jobs directly
- **Sends confirmations** — SMS texts go to customers immediately after booking
- **Detects emergencies** — Urgent calls alert you right away
- **Takes messages** — If you're unavailable, Maria takes detailed notes
- **Handles both languages** — English and Spanish, automatically

### Your Business Profile Powers Maria

Maria learns from the information you provide:
- Your services and pricing
- Your hours of operation
- Your service area
- Common customer questions (FAQs)

The more complete your profile, the better Maria can handle calls.

## Why Contractors Choose Capta

1. **Never miss a call** — Maria answers 24/7, even when you're in the field
2. **Automatic scheduling** — Appointments booked and managed in your Capta dashboard
3. **Bilingual** — Spanish and English, no extra cost
4. **Real data** — Call logs, transcripts, and customer info all in one place
5. **Affordable** — $497/month for unlimited calls and features

## Getting Started

1. **Set up your profile** (30 minutes) — Tell Maria about your services, pricing, and hours
2. **Set your availability** (5 minutes) — Configure your hours and availability so Maria can book appointments
3. **Forward your phone number** (varies) — Set up call forwarding to Capta
4. **Test Maria** (5 minutes) — Call your number and have a test conversation
5. **Go live** — Maria starts answering your real calls

## Get Started

$497/month with a 30-day money-back guarantee. See how Maria handles your calls, manages your schedule, and frees up your time.

Need help? Email support@captahq.com or call (830) 521-7133.`,
  },

  // ── Managing Calls (5 articles) ──
  {
    slug: "how-maria-handles-calls",
    categorySlug: "managing-calls",
    title: "How Maria Answers Your Calls",
    sortOrder: 9,
    searchKeywords: "calls, answering, booking, appointments, emergencies, messages, schedule, greeting, action",
    dashboardContextRoutes: ["/dashboard", "/dashboard/calls", "/dashboard/appointments"],
    relatedArticles: ["understanding-call-logs", "appointments-booked-tracked", "when-calls-transfer"],
    content: `When someone calls your business number, here's what Maria does:

1. **Answers with your greeting** — Uses the custom greeting you set up so callers know they reached your business
2. **Listens to understand** — Maria asks clarifying questions to understand what the caller needs
3. **Takes action** — Maria books the appointment, answers from your business info, or takes a message
4. **Keeps you informed** — You get SMS alerts and email notifications

### What Maria Can Handle

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
  },
  {
    slug: "appointments-booked-tracked",
    categorySlug: "managing-calls",
    title: "How Appointments Are Booked and Tracked",
    sortOrder: 11,
    searchKeywords: "appointments, booking, calendar, scheduling, reschedule, cancel, no-show, dashboard",
    dashboardContextRoutes: ["/dashboard/appointments"],
    relatedArticles: ["how-maria-handles-calls", "tips-best-results"],
    content: `### Maria's Booking Process

Maria gathers the information she needs:
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

**Pro tip:** Keep your hours and availability updated in your Capta settings so Maria always has your real availability.`,
  },
  {
    slug: "viewing-messages",
    categorySlug: "managing-calls",
    title: "Viewing Messages Maria Took",
    sortOrder: 12,
    searchKeywords: "messages, notifications, sms, follow up, urgency, voicemail, inbox",
    dashboardContextRoutes: ["/dashboard/sms"],
    relatedArticles: ["how-maria-handles-calls", "not-receiving-notifications"],
    content: `When Maria takes a message, you're notified immediately with:
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
- **Review for patterns** — If Maria keeps getting the same question, add it to your profile`,
  },
  {
    slug: "when-calls-transfer",
    categorySlug: "managing-calls",
    title: "When Calls Get Transferred to You",
    sortOrder: 13,
    searchKeywords: "transfer, emergency, escalation, handoff, urgent, hold",
    dashboardContextRoutes: ["/dashboard/calls"],
    relatedArticles: ["how-maria-handles-calls", "improve-maria-responses"],
    content: `Maria knows when to transfer a call:

**Maria transfers when:**
- Caller specifically asks to speak with you or your team
- She detects an emergency
- The topic is outside her training

**How transfers work:**
1. You get an instant SMS alert with call details
2. The caller is put on brief hold or stays in conversation
3. If you don't answer within a short time, Maria takes a message
4. You can follow up on your schedule

**Emergency transfers:**
- You receive a high-priority SMS marked urgent
- The call transfers immediately
- Act fast — these callers need help right away

### Check Transfer History

In the Calls section, see which calls were transferred and why. This helps you understand where Maria might need more information added to your profile.

## Improve Maria's Responses

Maria gets smarter when you help her. Go through these steps regularly:

1. **Update your business profile** — Add services, pricing, FAQs, hours, service area
2. **Review call transcripts** — Check where Maria struggled or transferred calls
3. **Customize your greeting** — Keep it fresh and informative

The more information you provide, the more calls Maria can handle without transferring to you.

Need help? Email support@captahq.com or call (830) 521-7133.`,
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

30-day money-back guarantee. Cancel anytime. No long-term contracts.`,
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

### Money-Back Guarantee

Not satisfied? Contact us within 30 days for a full refund. No questions asked.

### Monthly Billing

You're billed monthly on your signup date. Your invoice shows the exact charge date and amount.

### What If a Payment Fails?

If your card is declined, you get a 7-day grace period. We'll send email and SMS reminders to update your payment method. Your service keeps running during this time.

Update your card in **Settings → Billing** to avoid service suspension.

### Annual Billing

Choose annual billing and save $100/month. We charge your full annual amount once per year on your billing date.`,
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
  },
  {
    slug: "cancellation-policy",
    categorySlug: "billing-account",
    title: "Cancellation and Refunds",
    sortOrder: 20,
    searchKeywords: "cancel, refund, money-back, data retention, termination, penalty",
    relatedArticles: ["understanding-subscription", "billing-and-charges"],
    content: `### How to Cancel

Log into your dashboard and go to **Settings → Billing → Cancel Subscription**. Click cancel and confirm your request.

### When Does Cancellation Take Effect?

Your cancellation takes effect at the end of your current billing period. You keep full access to Capta until that date.

### No Cancellation Fees

There are no early termination fees, no penalties, and no hidden charges. Cancel anytime without cost.

### 30-Day Money-Back Guarantee

If you're a new subscriber and change your mind within 30 days, we'll refund your subscription fee in full. No questions asked.

### What Happens to Your Data?

After cancellation, your data is retained for 30 days. During this time, you can export your customer information, call history, and appointment records. After 30 days, all data is permanently deleted.

### No Contracts

We don't require long-term contracts. Cancel whenever you want.`,
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
  },

  // ── Troubleshooting (6 articles) ──
  {
    slug: "maria-not-answering",
    categorySlug: "troubleshooting",
    title: "Maria Isn't Answering My Calls",
    sortOrder: 22,
    searchKeywords: "not answering, forwarding, outage, troubleshoot, setup, phone, calls not working",
    relatedArticles: ["check-outage", "wrong-greeting"],
    content: `If your callers can't reach Maria, follow these steps:

**1. Check Call Forwarding Setup**
The most common issue is that call forwarding isn't configured. Go to **Settings** and verify your business phone number is set up to forward incoming calls to Maria. If you haven't done this yet, see our guide on setting up call forwarding.

**2. Verify Your Account is Active**
Check that your account is paid up and not suspended. Look at your billing status in the Settings tab. If you see any warnings, update your payment information immediately.

**3. Check for Service Outages**
Visit **captahq.com/status** to see if there's a known outage. During outages, Maria automatically switches to voicemail mode so callers can still leave messages.

**4. Test with a Different Phone**
Try calling your business number from a different phone. This helps identify if the issue is with your specific phone or with Maria's service.

**5. Still Not Working?**
Contact our support team. Have your account email and business name ready.

Email: **support@captahq.com**
Phone: **(830) 521-7133**`,
  },
  {
    slug: "wrong-greeting",
    categorySlug: "troubleshooting",
    title: "Callers Hear the Wrong Greeting",
    sortOrder: 23,
    searchKeywords: "greeting, wrong, update, customize, message, fix",
    relatedArticles: ["improve-maria-responses", "wrong-information"],
    content: `Your greeting is what callers hear first when Maria picks up. It's quick to fix.

**Update Your Greeting**
Log into your dashboard and go to **Settings → AI Greeting**. Edit the greeting text to match your business. Be clear and friendly—something like "Hi, thanks for calling Smith's Plumbing. How can I help you today?"

**Save and Test**
Click **Save** when you're done. The new greeting takes effect immediately. Test it by calling your business number from your phone. You should hear the updated message.

**Tips for a Great Greeting**
- Keep it under 20 seconds
- Say your business name clearly
- Let callers know how to reach you (callback, voicemail, etc.)
- Test after any changes`,
  },
  {
    slug: "wrong-information",
    categorySlug: "troubleshooting",
    title: "Maria Is Giving Wrong Business Information",
    sortOrder: 24,
    searchKeywords: "wrong info, outdated, update, services, pricing, hours, inaccurate",
    relatedArticles: ["improve-maria-responses", "wrong-greeting"],
    content: `Maria shares your business details with callers—but she only knows what you've told her. If the info is outdated, she'll repeat it.

**Update Your Settings**
Go to your dashboard and click **Settings**. Check these sections:

- **Services** — Make sure all services are listed and accurate
- **Pricing** — Update prices if you've changed them
- **Business Hours** — Confirm your hours are correct
- **Contact Info** — Verify phone number and address

**Make Your Updates**
Edit any outdated information and click **Save**. Maria will use the updated details on her next call.

**Keep It Current**
Review your business information monthly, especially if you add new services or change your pricing. This way, callers always get accurate answers.`,
  },
  {
    slug: "not-receiving-notifications",
    categorySlug: "troubleshooting",
    title: "Not Receiving Messages or Notifications",
    sortOrder: 25,
    searchKeywords: "notifications, sms, email, alerts, spam, missing, not receiving",
    dashboardContextRoutes: ["/dashboard/sms"],
    relatedArticles: ["viewing-messages", "dashboard-not-loading"],
    content: `If you're not seeing call notifications or messages from Maria:

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

- **Voice Service** — Maria answering calls
- **SMS** — Message delivery
- **Dashboard** — Account management
- **API** — Integrations

**What Happens During an Outage**
If there's an outage affecting Maria's voice service, she automatically switches to voicemail mode. Callers can still leave messages, and you'll still get notifications.

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
    content: `Every month, Maria gives you a complete summary of all the work she's done for your business. You'll find your report in the **Reports** section of your dashboard.

### What's in Your Report

- **Total Calls Handled** — How many calls Maria answered for you
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
Save your reports and compare them. Are you getting more calls each month? More appointments? That's a sign Maria is working for you.

**Check Customer Satisfaction**
High satisfaction scores mean customers are happy with Maria's responses. Low scores? It might be time to update your business information or FAQs.`,
  },
  {
    slug: "nps-health-score",
    categorySlug: "features-tips",
    title: "Understanding Your NPS (Net Promoter Score)",
    sortOrder: 30,
    searchKeywords: "nps, score, satisfaction, promoter, detractor, health, survey, customer feedback",
    relatedArticles: ["monthly-report", "improve-maria-responses"],
    content: `**NPS stands for Net Promoter Score.** It's a simple way to measure how satisfied your customers are with Maria on a scale from **-100 to 100**.

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
If customers complain about Maria's responses, update your business profile, pricing, or FAQ section. Train Maria better by giving her more information.

**Encourage Promoters**
When customers love you, ask them to leave reviews on Google or Yelp. Promoters are your best marketing tool.

**Monitor Trends**
Check your NPS every month. Are you improving? Track what changes helped.`,
  },
  {
    slug: "improve-maria-responses",
    categorySlug: "features-tips",
    title: "How to Improve Maria's Responses",
    sortOrder: 31,
    searchKeywords: "improve, profile, faq, greeting, customize, training, better responses",
    relatedArticles: ["tips-best-results", "wrong-information", "wrong-greeting"],
    content: `Maria gets smarter the more information you give her. Here are three simple ways to level up.

### 1. Update Your Business Profile

Go to Settings and make sure your business profile is complete and accurate:

- **Services** — List every service you offer with clear descriptions
- **Pricing** — Include service prices. If pricing varies, explain what affects the cost
- **Hours** — Set your business hours so Maria knows when to book appointments
- **FAQs** — Add answers to the questions you get asked most often. This is gold for Maria
- **Service area** — Tell Maria what areas you serve
- **Warranties or guarantees** — Include any promises you make to customers

### 2. Review Call Transcripts for Gaps

Spend 15 minutes a week reviewing call transcripts where Maria struggled or transferred the call. Look for patterns:

- Did callers ask about something Maria didn't know?
- Was there a topic that came up multiple times?
- What questions should Maria have been able to answer?

Once you identify gaps, add that information to your business profile or FAQs.

### 3. Customize Your AI Greeting

Your greeting sets the tone. A good greeting tells callers what to expect and how Maria can help:

- Include your business name and what you do
- Let people know Maria is an AI receptionist and what she can help with (appointments, questions, etc.)
- Let them know they can ask to speak with a human if they prefer

When callers understand what Maria can do, they ask better questions and she can help more often.`,
  },
  {
    slug: "tips-best-results",
    categorySlug: "features-tips",
    title: "5 Tips for Getting the Best Results from Maria",
    sortOrder: 32,
    searchKeywords: "tips, best practices, calendar, profile, greeting, faq, optimization",
    relatedArticles: ["improve-maria-responses", "what-is-capta"],
    content: `Maria is your AI receptionist, and like any team member, she works better when you set her up for success.

### Tip 1: Fill Out Your Business Profile Completely

Maria needs to know everything about your business:
- Every service you offer
- Pricing for each service
- Your service area and coverage zones
- Your hours of operation
- Any special certifications or licenses

### Tip 2: Add Common Questions and Answers

Think about the questions customers ask most often. Add these to your FAQ section in the dashboard. When customers ask, Maria already knows your answer.

### Tip 3: Keep Your Calendar Up to Date

Maria books appointments based on your available time. If your calendar is outdated, she'll book appointments you can't keep. Update it regularly and mark days off, lunch breaks, and admin time.

### Tip 4: Review Call Summaries Weekly

Spend 15 minutes reviewing Maria's call summaries. Look for patterns and use these insights to improve your profile and FAQ.

### Tip 5: Update Your Greeting Seasonally

Maria's greeting can change with the seasons. During winter, mention your holiday hours or emergency availability. In spring, highlight seasonal services like yard cleanup.`,
  },
  {
    slug: "bilingual-callers",
    categorySlug: "features-tips",
    title: "How Maria Handles Bilingual Callers",
    sortOrder: 33,
    searchKeywords: "bilingual, spanish, english, language, detection, switch, multilingual",
    relatedArticles: ["what-is-capta", "how-maria-handles-calls"],
    content: `One of Maria's best features is her ability to handle calls in both English and Spanish—automatically. You don't need to do anything special to set it up.

### How Language Detection Works

When a customer calls, Maria listens to the first few seconds of their speech and automatically detects whether they're speaking English or Spanish. Then she responds in that same language for the rest of the call.

It's seamless and happens in real-time. The caller never has to repeat themselves or ask for a Spanish-speaking receptionist.

### What If a Caller Switches Languages?

If a customer starts in English and then switches to Spanish mid-call (or vice versa), Maria switches languages too. She's fluent in both and makes the transition naturally.

This is especially helpful for bilingual customers who mix languages in a single conversation.

### Checking Language in Your Records

When you review your call logs in the dashboard, you'll see the detected language for each call. Call transcripts are always in the original language the caller used.`,
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
Capta uses magic link login instead of passwords. You receive a secure link via email, click it, and you're logged in.

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
  },

  // ── For Prospects (4 articles) ──
  {
    slug: "how-ai-receptionists-work",
    categorySlug: "for-prospects",
    title: "How AI Receptionists Work",
    sortOrder: 35,
    searchKeywords: "ai receptionist, technology, ivr, comparison, how it works, chatgpt, conversation, natural",
    relatedArticles: ["capta-vs-receptionist", "what-is-capta"],
    content: `Traditional phone systems make you "press 1 for billing, 2 for support." Those systems are frustrating because they don't understand what callers really want. AI receptionists are different. Maria has a conversation, just like a real person would.

### Maria's Call Handling

**Step 1: Listen and Understand**
When a caller reaches Maria, she listens to their first sentence and understands what they need immediately. No menus, no confusion.

**Step 2: Ask Clarifying Questions**
Maria doesn't pretend to know everything. If she needs more info, she asks natural questions. The conversation feels normal, not scripted.

**Step 3: Provide Information**
Maria answers questions about your services, pricing, availability, and hours. She uses the business profile you set up.

**Step 4: Book an Appointment**
If the caller wants to schedule something, Maria checks your availability and books it. She confirms the date, time, and caller info. The appointment appears in your Capta dashboard immediately.

**Step 5: Take a Message (If Needed)**
If you're fully booked or the caller can't schedule, Maria offers to take a message. She records the caller's name, phone, and issue, then sends you a summary.

### The Technology Behind It

Maria uses advanced language AI (similar to ChatGPT) trained specifically for customer service. She understands context, tone, and intent. She sounds natural because she's having a real conversation, not reading a script.

### What Makes It Better Than Old Systems

| Traditional IVR | AI Receptionist (Maria) |
|-----------------|------------------------|
| "Press 1 for..." (confusing) | Natural conversation |
| No understanding of context | Understands what callers really need |
| Can't book appointments | Schedules directly to your calendar |
| Callers hate them | Callers appreciate the service |

### What Maria Can't Do

Maria is designed for appointment scheduling and simple Q&A. She's not built for complex issues that need a real expert. If a caller has a technical problem that needs your expertise, Maria offers to take their info and have you call them back.

### Why Contractors Love This

You finally have someone answering your phone 24/7 who actually understands what customers want. No more missed calls. No more frustration. Just smooth, professional conversations that lead to booked jobs.`,
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

| Feature | Capta (Maria) | Human Receptionist |
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

**You're starting out** — You can't afford $30K/year for a receptionist. Maria lets you start at $497/month.

**You're overwhelmed with calls** — You're missing sales because you can't answer the phone. Maria answers every call 24/7.

**You have multiple locations** — Hiring a receptionist per location is expensive. Add Capta to a new location for just $197/month.

**You serve Spanish speakers** — Finding a bilingual receptionist is hard. Maria handles English + Spanish automatically.

**You want 24/7 coverage** — Receptionists work 9-5. Maria never sleeps. Emergencies at midnight? Maria answers.

### When You Might Hire a Receptionist

**You need complex problem-solving** — If most calls require judgment calls or customer relationship building, a human is better.

**You want face-to-face interaction** — A receptionist can greet walk-in clients. Maria only handles phone.

**You want someone to handle multiple roles** — A receptionist might also do scheduling, invoicing, or admin. Maria focuses on calls.

**You have super high call volume** — If you get 1,000+ calls per month, you might need a hybrid approach.

### The Hybrid Approach

Many successful contractors use both: Maria answers 24/7 calls and books routine appointments. During business hours, a human receptionist handles complex issues and manages office tasks. This is usually cheaper than hiring full-time reception staff and gives you the best of both worlds.`,
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

### The Solution: Maria Answers Every Call

With Capta, every call is answered—24/7. Maria:
- Picks up immediately (no voicemail jail)
- Books appointments automatically
- Qualifies leads if you're fully booked
- Works 24/7 (no missed night calls)
- Costs $497/month

Even if Maria only converts half of those missed calls into bookings, you're looking at $7,875+ extra revenue per month. That's a 16x return on her $497/month cost.`,
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
Call your business number from your personal phone. Maria answers. Test her — ask about your services, request an estimate, try an emergency scenario. She's live.

**That's it.** Maria is answering your real calls.

---

## What's Working From Day One

Everything is active immediately — no phased rollout, no waiting periods. Here's what Maria does starting with your very first call:

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
- **Photo request sent** — Maria texts the caller asking for photos of the job site. Photos attach to the job card automatically.
- **AI estimate generated** — based on the job details collected, Maria creates a price range. You confirm or adjust via text. Customer gets a real number, not "someone will call you back."
- **Owner notification** — you get a text summary. Reply right from your phone: "Book it for Thursday" or "Tell them $2,500" and Maria follows up with the customer.

### Missed Call Recovery
If a caller hangs up or the line drops, Maria auto-texts them within 60 seconds to re-engage. Most are recovered before they call your competitor.

### Automated Follow-Ups
- **Estimate follow-ups** — quotes that go cold get automatic follow-up texts and calls. Maria re-engages: "Hi, we sent you an estimate last week. Would you like to schedule the work?"
- **Customer recall** — past customers who haven't called in a while get proactive outreach: "It's been 12 months since your last AC tune-up — want to schedule your annual maintenance?"
- **Appointment reminders** — customers get automatic reminder calls before their appointments

### Partner Referral Network
When someone calls asking for a service you don't offer (e.g., an electrician calls a plumbing company), Maria refers them to a trusted partner in your network. They handle the job, you get a referral fee. Revenue from calls that aren't even your trade.

### Google Review Requests
After a completed job, Maria automatically asks the customer for a Google review. More reviews = higher rankings = more calls.

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

**By end of Week 1:** You'll have real data on how many calls you were missing and how much revenue Maria is recovering. Most contractors are surprised by the numbers.

---

## First Month Results

Average results after 30 days:
- **30-50% increase in booked appointments** — because you're answering calls you were missing
- **Missed calls recovered** — callers who would have gone to your competitor are now in your pipeline
- **Estimates generated and followed up** — no more quotes dying in your voicemail
- **Past customers reactivated** — dormant customers coming back for maintenance and new work
- **Clear ROI** — your dashboard shows exactly what Maria recovered vs. her $497/month cost

### If Results Are Lower Than Expected

Check these first:
- **Profile incomplete** — add more services, update pricing, refine your greeting
- **Call forwarding not set up correctly** — test by calling your business line
- **Not checking the dashboard** — Maria books appointments and creates job cards, but you still need to follow up on complex jobs
- **Low call volume market** — you're still capturing every call. The ROI compounds as volume grows.

---

## Get Started

30-day money-back guarantee. Full access to everything. Cancel anytime.

**Ready?** Get started at [captahq.com](https://captahq.com).

Need help? Email support@captahq.com or call (830) 521-7133.`,
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
    console.error("Help seed error:", error);
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
