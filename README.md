# Capta

AI-powered bilingual virtual receptionist for home service businesses. Answers calls 24/7 in English and Spanish, books appointments, takes messages, detects emergencies, and provides a full client + admin portal.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Database:** Drizzle ORM + SQLite/Turso (libsql)
- **Voice AI:** ElevenLabs Conversational AI (Twilio WebSocket bridge)
- **LLM:** Anthropic Claude (call summaries, QA scoring, content generation)
- **SMS/Calls:** Twilio
- **Email:** Resend
- **Payments:** Stripe (checkout, webhooks, billing portal)
- **Error Reporting:** Sentry
- **Testing:** Vitest + React Testing Library
- **Styling:** Tailwind CSS + CSS custom properties

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Generate database migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Start dev server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply database migrations |

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin portal (cookie auth, HMAC-SHA256)
│   ├── dashboard/      # Client portal (password + magic link auth)
│   ├── api/
│   │   ├── admin/      # Admin API routes
│   │   ├── dashboard/  # Client API routes
│   │   ├── agents/     # AI agent cron routes (6 agents)
│   │   ├── cron/       # Scheduled task routes
│   │   ├── webhooks/   # ElevenLabs + Twilio webhooks
│   │   ├── stripe/     # Stripe webhook + portal
│   │   └── ...
│   ├── (marketing)/    # Public marketing pages
│   ├── es/             # Spanish language pages
│   └── blog/           # Blog (EN/ES)
├── components/         # Shared UI components
├── db/
│   ├── schema.ts       # Drizzle schema (107 tables)
│   └── migrations/     # SQL migrations (0000-0077)
├── lib/
│   ├── ai/             # System prompts, context builder, call summary
│   ├── agents/         # Agent runtime, tools, prompts
│   ├── elevenlabs/     # Client, agent config, agent sync
│   ├── voice/          # Voice tool handlers (9 tools)
│   ├── capacity/       # Provider metrics, modeling, thresholds
│   ├── compliance/     # GDPR/CCPA consent, SMS opt-out, retention
│   ├── financial/      # Dunning, cost tracking
│   ├── incidents/      # Incident engine, notifications, postmortem
│   └── ...
└── middleware.ts       # Auth, CSRF, rate limiting
tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
├── fixtures/           # Test data
└── helpers/            # Test utilities
```

## Authentication

- **Admin:** Cookie-based with HMAC-SHA256 signed tokens
- **Client:** Password login (primary) + magic link fallback → signed token → cookie
- **Crons:** Bearer token via `CRON_SECRET`

## Environment Variables

Required environment variables (see `.env.example` for full list):

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso/libsql database URL |
| `ADMIN_PASSWORD` | Admin portal password |
| `CLIENT_AUTH_SECRET` | Client cookie signing secret |
| `CRON_SECRET` | Cron job authorization |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `RESEND_API_KEY` | Resend email API key |

## Deployment

Deployed on Vercel with 37 scheduled cron jobs for agents, capacity monitoring, financial tracking, and outbound campaigns. See `vercel.json` for the full schedule.
