# Capta Scale Audit

**Date:** 2026-02-26
**Stack:** Next.js 16 + Drizzle ORM + Turso (SQLite) + Hume EVI + Claude + Twilio + Resend
**Pricing:** $497/month per client
**Goal:** Scale to hundreds of home service businesses

---

## BUILT & WORKING

### Core AI Voice System
- **Hume EVI integration** — Full call lifecycle: `chat_started` -> real-time conversation -> `chat_ended`. KORA voice model, inactivity/max-duration timeouts, HMAC-SHA256 webhook verification with timing-safe comparison.
- **Claude-powered CLM endpoint** — OpenAI-compatible `/api/clm/chat/completions` streams Claude responses to Hume. Model configurable via `CLAUDE_MODEL` env var (defaults to claude-sonnet-4-5).
- **Dynamic system prompts** — Per-business context injection: name, type, services, hours, timezone, owner. Bilingual English/Spanish with runtime language detection. AI persona "Maria" follows strict phone-call response style (1-2 sentences max).
- **AI tool calling** — 4 working tools dispatched from Hume webhooks: `check_availability` (queries real hours + existing appointments), `book_appointment` (creates record + SMS confirmation to caller + SMS notification to owner), `take_message` (captures message + notifies owner via SMS), `transfer_to_human` (flags call + notifies owner).
- **Post-call summary** — Fire-and-forget async: fetches transcript from Hume API, sends to Claude for 1-3 sentence summary + sentiment analysis (positive/neutral/negative), stores results on call record.
- **Call data storage** — Full transcript (JSON array of speaker+text), duration, language, sentiment, summary, transfer status, direction, caller/called phone.

### Telephony & SMS
- **Twilio voice** — Inbound calls routed through Twilio to Hume EVI. Phone number per business.
- **Twilio SMS** — Inbound webhook with proper signature validation (hard fail if auth token unset). Handles STOP/START opt-out/opt-in keywords. Creates/updates leads. Stores all messages.
- **SMS notifications** — Owner notified on: new call handled, appointment booked, transfer requested, message taken. Caller gets appointment confirmation SMS.
- **Appointment reminders** — Cron endpoint sends next-day SMS reminders to all businesses' customers.

### Database Schema (16 tables, Drizzle ORM + Turso)
- `businesses` — Multi-tenant root: name, type, owner info, Twilio number, services, hours, timezone, language, greeting, avgJobValue, active flag.
- `leads` — Per-business callers with phone, name, email, language, source, smsOptOut.
- `calls` — Full call records with Hume IDs, transcript, summary, sentiment, duration, status.
- `appointments` — Service, date, time, duration, status (confirmed/cancelled/completed/no_show), reminder tracking.
- `smsMessages` — Direction, from/to, body, template type, Twilio SID, status.
- `prospects` — Sales pipeline: business name, phone, email, address, vertical, rating, review count, lead score, status pipeline, audit result, tags, source.
- `prospectAuditCalls` — Twilio call SID, status, duration, answeredBy (human/machine/unknown), ring time.
- `prospectOutreach` — Channel (email/sms), template key, status (sent/opened/clicked/bounced), timestamps.
- `demos` — Contact info, scheduled date, status, outcome (signed/follow_up/not_interested), revenue.
- `outboundCampaigns` + `campaignContacts` — Campaign scaffolding (draft/active/paused/completed).
- `customerNotes`, `systemHealthLogs`, `revenueMetrics`, `churnRiskScores`, `escalations`, `activityLog`.

### Prospect Pipeline & Outreach Engine
- **Google Places scraping** — `/api/scrape/city` queries Places API v1 with pagination (up to 200 results). Deduplicates by placeId. Enriches: Spanish detection, business size estimation, lead scoring (max 65 points).
- **CSV import** — Bulk prospect import with enrichment.
- **Audit call system** — Automated Twilio calls to prospects with machine detection. 50/day limit, 9am-5pm CT window, 20-second timeout. TwiML: 3-second pause + hangup. Status callback updates prospect record with result (answered/missed/voicemail/failed).
- **Outreach orchestrator** — State machine sequences: missed-call flow (SMS1 day 0, Email1 day 1, SMS2 day 3, Email2 day 5, Email3 day 7) and answered flow (Email1 only). Respects delays, tracks completion.
- **Email campaigns** — Resend integration. 4 templates (3 missed, 1 answered). Webhook tracking for opens/clicks/bounces.
- **SMS outreach** — 2 templates with opt-out handling. Keywords honored, flag persisted.
- **Demo tracking** — Create/update with outcome tracking. `signed` outcome auto-converts prospect.
- **Bulk operations** — Status changes, outreach start, CSV export for up to 500 prospects at once.

### Admin Portal
- **Login** — Single password auth with HMAC-signed cookie (7 days), rate-limited (5/min).
- **Dashboard** — System-wide metrics: prospect funnel counts, audit call stats, outreach stats, demo counts, active businesses, recent calls.
- **Clients page** — All businesses listed with call/appointment health stats. Detail view per client with tabs: calls, appointments, SMS, notes. Add client modal with Zod validation.
- **Calls page** — Global call stats, volume chart, language/sentiment breakdowns, recent calls with transcripts.
- **AI page** — Sentiment distribution, escalation log, quality metrics (completion rate, transfer rate, avg duration).
- **Billing page** — MRR/ARR display, churn risk scores, 30-day revenue trend, linear forecast.
- **Ops page** — System health logs, service status, recent errors.
- **Prospects page** — Full CRUD with search/filter, scrape modal, import modal, bulk actions.
- **Campaigns page** — Outreach campaign management.
- **Settings page** — Read-only view of email/SMS templates, Twilio config, API key status, scraping config.
- **Activity feed** — Global activity log with pagination.

### Client Dashboard
- **Magic link auth** — Email-based login: sends HMAC-signed token via Resend, 15-minute expiry, sets httpOnly cookie.
- **Overview** — Calls today, appointments this week, missed calls saved, revenue estimates, weekly summary, activity feed, business insights.
- **Calls page** — Paginated call history with search, transcript display, sentiment badges, recovery timeline.
- **Appointments page** — Upcoming/past appointments with calendar view.
- **SMS page** — Message history with expandable rows for full message body.
- **Settings page** — Read-only business info, hours, services, account stats.
- **Theme system** — Light/dark mode with CSS custom properties, toggle in sidebar.
- **Demo mode** — Hardcoded `demo-client-001` returns realistic fake data for all dashboard pages.

### Infrastructure
- **Sentry** — `@sentry/nextjs` integrated with error boundaries at root, admin, and dashboard route segments. Custom `reportError`/`reportWarning` utilities.
- **Env validation** — Zod schema for all env vars. Soft-fail (warn, don't crash) for partial configs.
- **Middleware** — Admin + dashboard route protection with HMAC cookie verification. Business ID injection via `x-business-id` header.
- **Input validation** — Zod schemas on most POST endpoints (client creation, notes, auth, prospect operations, demo management, scraping).
- **Rate limiting** — IP-based sliding window on auth (5/min), writes (20/min), standard reads (60/min), webhooks (200/min).
- **React voice component** — `@humeai/voice-react` with live transcript display, waveform visualization, error handling.

---

## PARTIALLY BUILT / MOCKED

### Billing System — View-Only Shell
- `revenueMetrics` and `churnRiskScores` tables exist but are **never populated by any automated process**. No Stripe integration. No payment processing. No invoice generation. No subscription lifecycle. Billing page displays whatever's manually inserted into the DB. Churn risk scores are never calculated — the table is empty unless manually seeded. Revenue forecast is naive linear extrapolation with no seasonal adjustment.

### Admin Settings — Read-Only Display
- Settings page shows email/SMS templates, Twilio config, API keys, scraping rules — but **nothing is editable**. All templates are hardcoded in source. All config requires code changes. Footer says "Contact us at support@capta.app." No admin can change AI configuration, system prompts, business hours defaults, or outreach sequences without deploying code.

### Client Self-Service — Read-Only Dashboard
- Clients can view all their data but **cannot modify anything**. No editing business hours, services, language preference, greeting, or contact info. No appointment management (cancel/reschedule). No self-service onboarding. Footer says "Contact us at support@capta.app."

### Per-Client AI Configuration — Schema Ready, UI Missing
- `businesses.humeConfigId` field exists in schema but is **never used in code**. All businesses share the same Hume config. System prompt template is global (persona "Maria", max 150 tokens, same call flow). No per-client prompt overrides, model selection, temperature tuning, or voice selection. Business context (name, services, hours) is injected, but the template structure is identical for all.

### Outbound Campaigns — Tables Only
- `outboundCampaigns` and `campaignContacts` tables exist in schema. Campaigns page exists in admin UI. But **no API routes or orchestration logic** for outbound call campaigns to a business's existing leads/customers. The outreach system only handles prospect outreach (selling Capta), not customer campaigns (reactivation, promotions on behalf of clients).

### Client Onboarding — Manual Process
- Add-client modal collects basic info and creates a DB record. But: **no automated Twilio number provisioning**, no Hume config creation, no welcome email, no onboarding checklist, no guided setup wizard. Admin must manually provision Twilio number, configure Hume, and set up the business. Defaults: 8-5 M-F hours, America/Chicago timezone, English, empty services array.

### Activity Log — Unbounded Growth
- `activityLog` table captures events across the system (scrapes, calls, emails, status changes) but has **no retention policy, no archival, no cleanup**. Will grow indefinitely and degrade query performance at scale.

### Env Validation — Soft Fail
- Zod schema validates env vars but **warns and continues** if validation fails. `ADMIN_PASSWORD` and `CLIENT_AUTH_SECRET` are marked optional — if unset, middleware falls through and grants full access to all admin/dashboard routes. This is a **silent security bypass** in production if these vars are accidentally removed.

### Email Compliance — Missing Requirements
- Email templates lack **unsubscribe links** (CAN-SPAM violation) and **physical address** in footer (CAN-SPAM violation). No opt-out honoring for email (only SMS has opt-out). Sending to prospects who haven't opted in.

### Webhook Security — Inconsistent
- Twilio SMS webhook: **properly validates** signatures (hard fail if token unset).
- Hume webhook: validates HMAC **only if** `HUME_SECRET_KEY` is set — silently accepts all requests if key is missing.
- Email outreach webhook: **zero validation** — accepts any POST payload, allowing fake open/click/bounce events.
- Audit call status webhook: **no Twilio signature validation** — accepts forged status callbacks.

---

## MISSING / NEEDED

### Payment Processing (Stripe)
- No payment processor integration whatsoever. No subscription management, payment method capture, invoice generation, failed payment handling, dunning flow, plan upgrades/downgrades, usage-based billing, or refunds. The `revenueMetrics` table is a manual placeholder. **Cannot charge clients $497/month without this.**

### Multi-Admin Auth & RBAC
- Single shared `ADMIN_PASSWORD` for all admins. No individual admin accounts, no roles (super admin / support / viewer), no audit trail of who did what, no session management, no 2FA, no SSO. At 100+ clients you need a support team, and a shared password with full access is a liability.

### Self-Service Client Signup
- No public signup flow. No trial period. No credit card capture. No email verification. No plan selection. Every client must be manually created by an admin. **This does not scale past ~20 clients.**

### Calendar Integration
- No Google Calendar, Outlook, or CalDAV sync. Appointments exist only in Capta's DB. Business owners must manually check the dashboard for new appointments. Double-booking is prevented only by checking Capta's own data — if the owner books directly in their calendar, the AI won't know. **Major friction point for clients.**

### CSRF Protection
- No CSRF tokens on any state-changing request. Cookie-based auth + no CSRF = vulnerable to cross-site request forgery on all POST/PATCH endpoints.

### Production Rate Limiting
- Current rate limiter is an in-memory `Map`. Each serverless instance (Vercel function) has its own map. Under load, limits are effectively multiplied by instance count. A single IP could bypass limits entirely by hitting different instances. **Need Redis/Upstash-based distributed rate limiting.**

### Unauthenticated Critical Routes
These routes have **zero authentication** and are publicly accessible:
- `/api/prospects/*` (all 4 routes) — **Entire prospect database (PII: names, phones, emails, addresses) readable and writable by anyone.**
- `/api/clm/chat/completions` — **Unauthenticated AI endpoint with `Access-Control-Allow-Origin: *`. Any website can drive up Anthropic API costs.**
- `/api/audit/call/[id]` and `/api/audit/schedule` — **Anyone can trigger real outbound phone calls.**
- `/api/hume/token` — **Returns live Hume API credentials to any caller.**
- `/api/demos/*` — **All demo records (PII) readable/writable without auth.**
- `/api/outreach/start` — **Triggers real emails/SMS to real prospects without auth.**
- `/api/scrape/city` — **Consumes Google Places API quota without auth.**
- `/api/cron/reminders` — **Sends real SMS to all customers if `CRON_SECRET` is unset.**

### Data Isolation Hardening
- Dashboard routes check `x-business-id` header presence but the header is derived from the verified cookie payload in middleware, so it's safe against direct header spoofing. However, there's no defense-in-depth: if middleware is ever bypassed (e.g., misconfigured matcher), all client data is exposed.

### Monitoring & Alerting
- No application performance monitoring (APM). No uptime monitoring. No alert system for: failed calls, Hume/Twilio outages, Anthropic API errors, high error rates, churn risk triggers, unusual call patterns. `systemHealthLogs` table exists but is never populated by any automated health check.

### Per-Client Cost Tracking
- No tracking of Anthropic API tokens, Twilio minutes/SMS, Hume minutes per client. Cannot calculate per-client COGS or identify unprofitable accounts. At $497/month, a single client with high call volume could cost more than their subscription.

### Database Scaling
- SQLite (Turso) is fine for early stage but: no connection pooling strategy documented, no read replicas, no database-level row isolation between tenants, no query performance monitoring, no migration rollback strategy. Activity log and transcript storage will grow fastest.

### Admin Logout
- No admin logout endpoint. Cookie can only expire (7 days) or be cleared client-side. No server-side session invalidation. If an admin's credentials are compromised, you cannot force-logout.

### Automated Testing
- Zero test files in the codebase. No unit tests, integration tests, or E2E tests. No CI/CD pipeline visible. Deploying to production with no test safety net.

### Client Communication
- No in-app messaging between admin and client. No automated email reports (weekly summaries, monthly invoices). No onboarding email sequence. No churn prevention outreach. Owner SMS notifications exist but email notifications are `console.log` placeholders.

### TCPA Compliance for Audit Calls
- Audit call system calls businesses without prior express written consent (TCPA violation). No consent tracking, no Do-Not-Call list checking, no opt-out mechanism during calls. **$500-$1,500 penalty per call.**

### Call Recording
- Only text transcripts stored. No audio recordings. Many businesses need call recordings for quality assurance, dispute resolution, or compliance.

### Backup & Disaster Recovery
- No documented backup strategy. No point-in-time recovery. No disaster recovery plan. Turso may have built-in replication, but there's no application-level backup verification.

### API Versioning
- No API versioning. All routes are unversioned. Breaking changes will affect all consumers simultaneously.

---

## RECOMMENDED BUILD ORDER

Priority is: **can charge money** -> **won't get sued** -> **can support 100+ clients** -> **can grow efficiently**.

### Phase 1: Security & Payment (Weeks 1-3) — Launch Blocker

1. **Lock down unauthenticated routes** — Add admin middleware to `/api/prospects/*`, `/api/audit/*`, `/api/demos/*`, `/api/outreach/*`, `/api/scrape/*`. Add Hume-origin verification or auth to `/api/clm/chat/completions` and remove `Access-Control-Allow-Origin: *`. Add auth to `/api/hume/token`. Make `CRON_SECRET` mandatory.
2. **Make env validation hard-fail** — `ADMIN_PASSWORD` and `CLIENT_AUTH_SECRET` must be required (not optional). Middleware should return 500 if these are unset, not silently pass through.
3. **Stripe integration** — Subscription creation on client onboarding, payment method capture, webhook handling for `invoice.paid`/`invoice.payment_failed`/`customer.subscription.deleted`, dunning flow for failed payments, auto-suspend for non-payment. Populate `revenueMetrics` from real Stripe data.
4. **Email compliance** — Add unsubscribe links and physical address to all outreach email templates. Implement email opt-out handling.
5. **CSRF protection** — Add CSRF tokens to all state-changing endpoints.
6. **Consistent webhook validation** — Add Twilio signature verification to `/api/audit/status`. Make Hume signature verification mandatory (fail if key unset). Add Resend/SVIX signature verification to email outreach webhook.

### Phase 2: Auth & Multi-Admin (Weeks 3-5)

7. **Multi-admin auth system** — Individual admin accounts with email/password or SSO. Role-based access: super admin (full access), support (read + limited write), viewer (read-only). Audit trail for all admin actions (who changed what, when).
8. **Admin logout** — Server-side session invalidation endpoint. Session management dashboard.
9. **2FA for admin** — TOTP-based two-factor authentication for admin accounts.
10. **Distributed rate limiting** — Replace in-memory rate limiter with Upstash Redis. Add rate limiting to all admin routes that currently lack it.

### Phase 3: Client Self-Service & Onboarding (Weeks 5-8)

11. **Self-service signup** — Public signup form -> Stripe checkout -> account creation -> welcome email -> guided setup wizard. Trial period support.
12. **Client settings editing** — Allow clients to update business hours, services, language preference, greeting, contact info from their dashboard. Add API endpoints for updates.
13. **Calendar integration** — Google Calendar OAuth + sync. Two-way: appointments created by AI appear in Google Calendar, existing calendar events block availability for AI booking.
14. **Automated onboarding** — Twilio number provisioning via API, Hume config creation, welcome email sequence, onboarding checklist tracking.
15. **Appointment management** — Client can cancel/reschedule appointments from dashboard. Cancellation sends SMS to original caller.

### Phase 4: Monitoring & Operations (Weeks 8-10)

16. **Per-client cost tracking** — Track Anthropic tokens, Twilio minutes/SMS, Hume minutes per business. Calculate per-client COGS. Alert on unprofitable accounts.
17. **Automated health checks** — Populate `systemHealthLogs` with real data. Cron job checking Hume, Twilio, Anthropic, Turso availability. Alert on degraded service.
18. **Monitoring & alerting** — Error rate dashboards, failed call alerts, unusual pattern detection, churn risk auto-emails, Slack/email notifications for critical events.
19. **Activity log retention** — Implement log rotation: archive logs older than 90 days, delete older than 1 year. Add indexes for performance.
20. **Automated testing** — Unit tests for critical paths (auth, tool handlers, outreach orchestrator), integration tests for API routes, E2E tests for call flow.

### Phase 5: Scale & Growth (Weeks 10-14)

21. **Per-client AI configuration** — Admin UI to customize per business: system prompt overrides, persona name, max tokens, language preference, voice selection, greeting. Use `humeConfigId` field that's already in schema.
22. **Client communication** — Weekly email reports (calls handled, appointments booked, missed calls saved, estimated revenue). Monthly billing summaries. Churn prevention outreach for low-engagement clients.
23. **Admin bulk operations** — Bulk client import, bulk settings updates, batch operations dashboard.
24. **Client API keys** — API access for clients to integrate with their own systems. Webhook subscriptions for real-time events.
25. **Outbound campaigns for clients** — Wire up `outboundCampaigns` and `campaignContacts` tables. Allow businesses to run reactivation/promotion campaigns to their own leads via AI calls or SMS.
26. **Call recordings** — Optional audio recording storage (S3/R2) with playback in dashboard.
27. **TCPA compliance** — Consent management layer for audit calls. DNC list integration. Opt-out tracking.
28. **Database scaling** — Connection pooling, read replicas for dashboard queries, query performance monitoring, migration rollback strategy, automated backups with verification.

---

## Raw Numbers

| Metric | Value |
|--------|-------|
| Database tables | 16 |
| API routes | 43 |
| Routes with zero auth | 15 (35%) |
| Routes with rate limiting | 20 (47%) |
| Routes with Zod validation | 15 (35%) |
| Test files | 0 |
| Admin auth model | Single shared password |
| Payment integration | None |
| Calendar integration | None |
| Automated health checks | None |
| Email compliance (CAN-SPAM) | Non-compliant |
| Audit call compliance (TCPA) | Non-compliant |

---

## Bottom Line

The AI voice system is legitimately impressive — Hume + Claude + Twilio working end-to-end with per-business context, bilingual support, real appointment booking, and async call summaries. The prospect pipeline and outreach automation are fully functional. Both admin and client dashboards are well-built with good UX.

**But you cannot charge $497/month today.** There's no payment processing, 35% of API routes are publicly accessible with zero auth (including one that exposes your entire prospect database), there's no self-service signup, clients can't edit their own settings, there's no calendar integration, and the email outreach violates CAN-SPAM.

The path to production is straightforward: lock down security (Phase 1), add Stripe (Phase 1), build multi-admin auth (Phase 2), add client self-service (Phase 3). Phases 1-3 get you to a chargeable product. Phases 4-5 get you to scale.
