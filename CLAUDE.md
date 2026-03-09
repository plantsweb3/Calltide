# CLAUDE.md — Calltide Project Instructions

## Project Overview

Calltide is an AI-powered bilingual (EN/ES) receptionist platform for home service businesses. It handles inbound calls via Hume EVI voice AI, books appointments, takes messages, handles emergencies, and provides a full client + admin portal.

## Tech Stack

- **Framework:** Next.js 16 App Router, TypeScript
- **Database:** Drizzle ORM with SQLite/Turso (libsql)
- **Voice AI:** Hume EVI (WebSocket-based voice conversations)
- **LLM:** Anthropic Claude (call summaries, QA scoring, content generation)
- **SMS/Calls:** Twilio
- **Email:** Resend
- **Payments:** Stripe (checkout, webhooks, billing portal)
- **Error Reporting:** Sentry
- **Testing:** Vitest + React Testing Library
- **Styling:** CSS custom properties (`--db-*` variables), Tailwind CSS

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin portal (cookie auth, HMAC-SHA256)
│   ├── dashboard/      # Client portal (password + magic link auth)
│   ├── api/
│   │   ├── admin/      # Admin API routes (cookie auth via middleware)
│   │   ├── dashboard/  # Client API routes (x-business-id injection via middleware)
│   │   ├── webhooks/   # Hume + Twilio webhooks
│   │   ├── stripe/     # Stripe webhook + portal
│   │   ├── agents/     # Background AI agents (cron-triggered)
│   │   └── ...
│   └── page.tsx        # Landing page
├── components/         # Shared UI components
├── db/
│   ├── schema.ts       # Drizzle schema (83 tables)
│   ├── index.ts        # DB connection
│   └── migrations/     # SQL migrations (0000-0053)
├── lib/
│   ├── ai/             # System prompts, context builder, call summary
│   ├── hume/           # Tool handlers, webhook verification
│   ├── receptionist/   # Personality presets, custom responses, trade profiles
│   ├── rate-limit.ts   # Turso-backed rate limiter with in-memory L1 cache
│   ├── error-reporting.ts  # Sentry integration
│   ├── integrations.ts     # Graceful API key availability checks
│   └── ...
├── middleware.ts       # Auth + CSRF + rate limiting
└── types/              # TypeScript type definitions
tests/
├── unit/               # Unit tests (Vitest)
└── integration/        # Integration tests
```

## Architecture Overview

- `/app/(marketing)/*` — Public pages (homepage, pricing, platform, about, faq, blog, help, legal, status)
- `/app/dashboard/*` — Client portal (20 pages: calls, appointments, CRM, estimates, billing, settings, referrals, partners, import, onboarding)
- `/app/admin/*` — Admin portal (30 pages: mission control, clients, prospects, agents, campaigns, blog CMS, KB, compliance, financials, incidents)
- `/app/api/*` — 212 API routes
- `/src/db/*` — Drizzle schema (83 tables) + migrations
- `/src/lib/*` — Shared utilities (auth, env, rate-limit, error-reporting)

## Authentication

- **Admin:** Cookie-based (`calltide_admin`) with HMAC-SHA256 signed tokens. Password in `ADMIN_PASSWORD` env var.
- **Client:** Password login (primary) + magic link fallback (both supported). `calltide_client` cookie with JWT-like signed tokens. Single-use magic tokens via `usedMagicTokens` table.
- **Sessions:** JWT-like tokens verified in middleware.
- **Middleware:** Handles auth for `/admin/*`, `/api/admin/*`, `/dashboard/*`, `/api/dashboard/*`. Injects `x-business-id` header for client routes.

## Key Patterns

- Zod on all POST/PUT
- Password login + magic link auth, middleware sessions
- External: Twilio, Hume EVI, Stripe, Resend, Anthropic, Google Calendar
- 31 cron-scheduled routes (CRON_SECRET protected): 18 cron jobs, 6 AI agents, 3 capacity, 3 financial, 1 compliance
- 212 API routes
- Demo mode with isolated data
- Onboarding: 8-step wizard, paywall at step 6 (after test call), incomplete signups saved for retargeting

### API Routes
- All routes use Zod for input validation
- Rate limiting via `rateLimit()` (async, Turso-backed)
- Admin routes: check `calltide_admin` cookie
- Client routes: middleware injects `x-business-id` header
- Error responses: generic messages to clients, `reportError()` for internal logging

### Database
- Drizzle ORM with SQLite/Turso
- Migrations in `src/db/migrations/` (numbered 0000-0053)
- Journal in `src/db/migrations/meta/_journal.json`
- All tables defined in `src/db/schema.ts`

### Styling
- CSS custom properties: `--db-bg`, `--db-surface`, `--db-card`, `--db-text`, `--db-text-muted`, `--db-accent`, `--db-border`, `--db-hover`
- Light/dark mode via `data-theme` attribute
- Tailwind CSS for utility classes

### Error Handling
- `reportError(message, error, context?)` — logs to console + Sentry
- `reportWarning(message, extra?)` — logs to console + Sentry at warning level
- Never expose internal error details to clients

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
```

## Commit Conventions

- `fix:` for bug fixes and security patches
- `feat:` for new features
- `chore:` for tests, docs, tooling

## Pricing

ONE plan: $497/month or $4,764/year ($397/mo effective, saves $1,200). No tiers.

## Style

- Font: Inter only (no serifs)
- Colors: Navy #1B2A4A, Gold #D4A843, Dark #0f1729
- Tailwind + Lucide icons
- Voice: "jobs" not "conversions", "answers your phone" not "handles inbound"

## Do NOT

- Use serif fonts or dev metrics in UI
- Add pricing tiers — single plan only
- Lower the price below $497
- Use "Start Free Trial" — always "Get Calltide →"

## Important Notes

- **Bilingual:** All user-facing content must support English and Spanish
- **Receptionist name is dynamic:** Use `biz.receptionistName || "Maria"` — never hardcode "María"
- **Rate limiting is async:** All `rateLimit()` calls require `await`
- **No PII in logs:** Never log phone numbers, emails, or customer data
- **Hume SDK typing issue:** `src/lib/ai/call-summary.ts` line 31 has a known `Page<ReturnChatEvent>` typing workaround — do not try to fix
- **Anthropic API key:** May be invalid/placeholder — agents and AI features gracefully degrade via `isAnthropicConfigured()`
- All 20 features ship at the $497/mo Core tier — no feature gating
