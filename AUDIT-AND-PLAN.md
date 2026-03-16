# Capta Full Audit & Improvement Plan

## Executive Summary

After auditing the entire codebase (225+ API routes, 91 tables, 20+ dashboard pages), researching 12 competitors, and tracing every user flow end-to-end, here's the reality:

**Capta is 80% of an excellent product.** The architecture is solid, the voice AI pipeline works, the CRM/portal/billing stack is more complete than any competitor under $1,000/mo. But there are ~15 issues that would make a paying customer cancel within the first month, and 1 strategic gap (FSM integration) that loses deals before they start.

The $497/mo price is defensible — but only if the last 20% gets closed.

---

## The Competitive Landscape (TL;DR)

| Competitor | Price | Threat Level | Why |
|---|---|---|---|
| **Sameday AI** | ~$300-600/mo | CRITICAL | Native ServiceTitan partner, 92% booking rate, home-services-only |
| **Rosie AI** | $49-299/mo | HIGH | 10x cheaper, has ServiceTitan/HCP integration, 1,600 businesses |
| **Housecall Pro CSR AI** | $200-500/mo add-on | HIGH | Built into platform owners already use |
| **Smith.ai** | $95-2,100/mo | MEDIUM | Human fallback, 7,000+ integrations |
| **Goodcall** | $79-249/mo | MEDIUM | Unlimited minutes, simple setup |
| **Ruby** | $245-1,640/mo | LOW | Pure human, expensive, per-minute |

**Capta's moat:** All-in-one platform (CRM + portal + estimates + QA scoring + owner SMS tools). No competitor under $1,000/mo offers this. But without ServiceTitan/HCP/Jobber integration, prospects with FSM software will choose Rosie at $149 or Sameday every time.

**Market stats that matter:**
- Home service businesses miss 40-60% of inbound calls
- 85% of callers who hit voicemail call the next contractor
- Average missed call = $300-1,200 in lost revenue
- 73% of calls come outside 9-5
- At $497/mo, Capta pays for itself by booking 1.66 extra jobs/month at $300 avg ticket

---

## P0 — Fix Before Anyone Pays ($497 = Must Work Flawlessly)

These are bugs/gaps that would cause a paying customer to cancel or lose money.

### P0-1: Call summary failure silently kills owner notifications
**Risk: CRITICAL** | **Effort: 2 hours**

**Problem:** When `processCallSummary()` fails (Anthropic API down, timeout, etc.), the owner gets NO notification about the call. No SMS alert, no missed call text-back, no appointment confirmation. The call record exists in the DB with null summary forever. No retry.

**Files:** `src/app/api/webhooks/hume/route.ts`, `src/lib/ai/call-summary.ts`

**Fix:**
1. Move `sendOwnerCallAlert()` and `sendMissedCallTextBack()` OUT of `processCallSummary()` — fire them immediately in `handleChatEnded()` with basic info (caller phone, duration, timestamp)
2. Add summary details to the notification later if/when summary succeeds
3. Add a retry mechanism: if summary fails, enqueue for retry (the `enqueueJob` call exists but the job processor doesn't exist)
4. Show "Summary unavailable — Regenerate" button in dashboard instead of blank

### P0-2: No buffer time between appointments
**Risk: CRITICAL** | **Effort: 1 hour**

**Problem:** Availability slots are back-to-back. If a plumber has a 60-min job ending at 2:00 PM, the next slot starts at 2:00 PM. No travel time. This WILL cause missed appointments in the real world.

**Files:** `src/lib/calendar/availability.ts`, `src/db/schema.ts`

**Fix:**
1. Add `bufferMinutes` field to businesses table (default 30)
2. In `checkAvailability()`, subtract buffer from each slot's available window
3. Add buffer config to Settings > General in dashboard

### P0-3: Slot generation always hourly regardless of service duration
**Risk: HIGH** | **Effort: 1 hour**

**Problem:** The availability loop increments by 60 minutes always. A 30-minute service only offers hourly slots (8:00, 9:00, 10:00), wasting half the schedule. A 90-minute service offers slots that overlap.

**File:** `src/lib/calendar/availability.ts` (line 127)

**Fix:** Change `min += 60` to `min += slotDuration` (or a configurable increment like 30 minutes).

### P0-4: Timezone bug in appointment lookup
**Risk: HIGH** | **Effort: 30 min**

**Problem:** `handleLookupAppointments` uses `new Date().toISOString().split("T")[0]` which is UTC, not business timezone. A 10 PM appointment in Pacific time is March 17 in UTC but March 16 locally. Owner sees wrong day's appointments.

**File:** `src/lib/hume/tool-handlers.ts` (line 679)

**Fix:** Use the business timezone to compute "today":
```typescript
const today = new Date().toLocaleDateString("en-CA", { timeZone: biz.timezone });
```

### P0-5: Past-due businesses still receive full service during grace period
**Risk: HIGH** | **Effort: 1 hour**

**Problem:** When payment fails, business enters `grace_period` but `active` stays true. The AI receptionist keeps answering calls, booking appointments, sending SMS — for 14+ days of unpaid service.

**Files:** `src/app/api/webhooks/twilio/voice/route.ts`, `src/lib/financial/dunning.ts`

**Fix:**
1. During grace period: calls still answered (good will), but SMS confirmations include "Service interruption notice"
2. After grace period expires: set `active: false`, calls get "This business's service is temporarily unavailable"
3. Show clear countdown on billing page: "Payment failed. X days until service pauses."

### P0-6: Voicemail recordings never processed
**Risk: HIGH** | **Effort: 2 hours**

**Problem:** When Hume is down, fallback TwiML records a voicemail. But the recording URL is never fetched, transcribed, or shown to the business owner. The voicemail exists only on Twilio's servers.

**File:** `src/app/api/webhooks/twilio/voice/route.ts`

**Fix:**
1. Add recording status callback URL to TwiML `<Record>`
2. Create handler that fetches recording, transcribes (Twilio built-in), saves to calls table
3. Send owner SMS: "Voicemail from [phone]: [transcription]"

### P0-7: No email uniqueness check during setup
**Risk: MEDIUM** | **Effort: 30 min**

**Problem:** A returning customer can complete the entire setup again, pay again, and create a duplicate business. The Stripe webhook deduplicates by `ownerEmail` but only after payment.

**File:** `src/app/api/setup/step/[stepNumber]/route.ts`

**Fix:** On step 2, check if email exists in businesses table. If yes, redirect to login.

### P0-8: Empty services list allowed during setup
**Risk: MEDIUM** | **Effort: 15 min**

**Problem:** Services are optional in the Zod schema. A user can pay $497 and have an AI receptionist that can't tell callers what the business does.

**File:** `src/app/api/setup/step/[stepNumber]/route.ts`

**Fix:** Make services required with `.min(1, "Add at least one service")` in the step 1 schema.

### P0-9: MariaSavedCard hardcodes "Maria"
**Risk: LOW** | **Effort: 5 min**

**Problem:** CLAUDE.md says never hardcode "Maria". The MariaSavedCard component does.

**File:** `src/app/dashboard/(portal)/page.tsx`

**Fix:** Use `data.receptionistName || "Maria"` in the card title.

---

## P1 — Critical Product Gaps (What Loses Deals)

### P1-1: ServiceTitan / Housecall Pro / Jobber integration
**Risk: DEAL-BREAKER** | **Effort: 2-4 weeks**

**Why this matters more than anything else:** Every serious home services buyer uses one of these three FSM platforms. Without integration, the AI books an appointment in Capta's calendar but the owner has to manually re-enter it into ServiceTitan. This creates double work and is the #1 reason prospects choose Rosie ($149) or Sameday over Capta ($497).

**Approach (phased):**

Phase 1 — Zapier integration (1 week):
- Create Zapier triggers for: appointment_created, call_completed, estimate_created, customer_created
- Create Zapier actions for: create_appointment, update_customer
- This gives immediate connectivity to 5,000+ apps including all FSM platforms

Phase 2 — Native HCP/Jobber via API (2-3 weeks each):
- Housecall Pro has a public REST API
- Jobber has a GraphQL API
- Two-way sync: push appointments from Capta → FSM, pull availability from FSM → Capta

Phase 3 — ServiceTitan partnership (longer term):
- ServiceTitan requires a technology partner application
- Start the application process now — it takes 2-3 months

### P1-2: Dashboard internationalization (Spanish)
**Risk: BRAND DAMAGE** | **Effort: 1-2 weeks**

**Problem:** The platform sells bilingual AI but the entire dashboard is English-only. A Spanish-speaking business owner logs in and sees "Good morning", "Calls This Week", "Revenue Captured" — all in English. This contradicts the bilingual promise.

**Fix:**
1. Create `src/lib/i18n/` with EN/ES string maps
2. Add language toggle to dashboard header (persist in localStorage)
3. Translate all dashboard strings, metric labels, setup checklist, empty states
4. Priority pages: Overview, Calls, Appointments, Settings, Billing

### P1-3: Estimate delivery mechanism
**Risk: FEATURE GAP** | **Effort: 1 week**

**Problem:** Estimates have a full pipeline (new → sent → follow_up → won → lost) but there's no way to actually SEND an estimate. No PDF generation, no email, no SMS delivery. The "sent" status is meaningless.

**Fix:**
1. PDF generation using a template (business logo, line items, terms)
2. Email delivery via Resend
3. SMS link delivery via Twilio
4. Customer-facing estimate view page (`/estimate/[token]`)
5. One-click approve from customer view → status changes to "won"

### P1-4: Estimate line items
**Risk: FEATURE GAP** | **Effort: 3 days**

**Problem:** Estimates have a single `amount` field. A plumber can't break down "Replace water heater" into materials ($800) + labor ($300) + permits ($100). This makes estimates feel amateur.

**Fix:**
1. Add `estimateLineItems` table (estimateId, description, quantity, unitPrice, total)
2. Update estimate creation form to support multiple line items
3. Auto-calculate total from line items
4. Include line items in PDF generation

### P1-5: Customer timeline / unified history
**Risk: UX GAP** | **Effort: 3 days**

**Problem:** A customer's calls, appointments, estimates, and SMS messages are siloed across 4 different pages. The owner can't see "John called Tuesday, booked for Thursday, got estimate Friday, texted Saturday" in one place.

**Fix:** Add a customer detail page (`/dashboard/customers/[id]`) with a chronological timeline of all interactions.

### P1-6: Appointment calendar view
**Risk: UX GAP** | **Effort: 2 days**

**Problem:** Appointments are shown as a list. For a home service business managing 5-15 appointments per day, a calendar view (day/week) is essential to see the schedule at a glance.

**Fix:** Add week/day calendar view to the appointments page using a lightweight calendar component.

### P1-7: No call duration limit
**Risk: COST** | **Effort: 30 min**

**Problem:** No maximum call duration. A caller could stay connected indefinitely, racking up Hume EVI costs.

**Fix:** Add `maxCallDuration` to business config (default 30 min). Add TwiML timeout or Hume session limit.

---

## P2 — Conversion & Retention Improvements

### P2-1: ROI calculator on marketing site
**Effort: 1 day**

Let prospects enter: trade type, avg job value, estimated missed calls/week. Output: "You're losing $X/month. Capta costs $497. ROI: X jobs to break even."

This is the single most persuasive conversion tool. Every competitor research confirms "show me the math" is what home service owners need.

### P2-2: Setup wizard test call before paywall
**Effort: 3 days**

The CLAUDE.md says "paywall at step 6 (after test call)" but the actual flow goes straight to checkout with no test call. Hearing the AI answer is the most powerful demo. Add a step where the user can call their configured number and hear Maria answer with their business name, before paying.

### P2-3: Abandoned setup retargeting
**Effort: 2 days**

Setup sessions are tracked but no follow-up emails fire when someone abandons:
- Abandoned at step 2 (PII collected): Send "Complete your setup" email at +2h, +24h, +72h
- Abandoned at checkout: Send "Your AI receptionist is ready — complete payment" at +1h, +24h
- Use Resend for delivery, templates in both EN/ES

### P2-4: Customer merge capability
**Effort: 2 days**

Same person calls from different numbers → creates duplicate records. Add "Merge customers" action in CRM that combines call history, appointments, estimates.

### P2-5: Booking rate tracking & display
**Effort: 1 day**

Track: (appointments booked by AI) / (total calls where caller asked about scheduling). Display as headline metric. Sameday claims 92%, Avoca claims 90%. Capta needs this number.

### P2-6: Carrier-specific call forwarding instructions
**Effort: 1 day**

The setup checklist says "Forward your business number" but doesn't explain how. Add carrier-specific instructions:
- Verizon: Dial *72 + [number]
- AT&T: Dial *21* + [number]#
- T-Mobile: Dial **21* + [number]#
- Landline: Call your provider

### P2-7: Annual plan upsell
**Effort: 4 hours**

After 3 months on monthly plan, show dashboard banner: "Save $1,200/year — switch to annual billing." Link to Stripe billing portal.

### P2-8: Appointment confirmation replies
**Effort: 1 day**

When reminder SMS goes out, let customer reply YES/NO. YES confirms attendance (owner sees confirmation). NO triggers reschedule prompt.

### P2-9: Payment failure instant SMS
**Effort: 2 hours**

Currently, dunning starts but the owner isn't immediately notified. Send SMS on `invoice.payment_failed`: "Your Capta payment of $497 failed. Update your card: [billing link]"

### P2-10: Spam call filtering
**Effort: 1 day**

No spam detection exists. Add basic filtering:
- Block calls from numbers that called >3 times in 5 minutes
- Check against known spam databases (Twilio Lookup Add-on)
- Mark as spam in call record (don't bill Hume minutes)

---

## P3 — Strategic Improvements (Month 2-3)

### P3-1: Emergency dispatch automation
When AI detects emergency (gas leak, flooding, no heat), automatically SMS on-call technician with customer name, phone, address, and problem description. Don't just take a message — dispatch.

### P3-2: Automated review solicitation
After service appointment completed, auto-text customer: "How was your experience with [business]? Leave a review: [Google link]". Rosie does this. It's table stakes.

### P3-3: Lead scoring
Score customers based on: call frequency, job value requested, response to texts, appointment completion rate. Show hot/warm/cold indicators in CRM.

### P3-4: AI call coaching insights
Aggregate QA scores across all calls. Identify patterns: "Maria struggles with pricing questions — add pricing to knowledge base." Show weekly AI performance report.

### P3-5: Concurrent call queuing
If business gets >N simultaneous calls, queue overflow with: "All our representatives are currently helping other customers. You're next in line. Estimated wait: 2 minutes."

### P3-6: GDPR/data deletion automation
Schema has `dataDeletedAt` flag but no automated cleanup. Implement cascading anonymization of PII when deletion requested.

---

## Edge Cases to Fix (Low Effort, High Impact)

| Issue | File | Fix | Effort |
|---|---|---|---|
| Cancellation doesn't verify caller owns appointment | tool-handlers.ts | Check `ctx.callerPhone` matches lead phone | 15 min |
| Past dates can be booked | tool-handlers.ts | Validate date >= today in business timezone | 15 min |
| Google Calendar failure is silent | availability.ts | Log warning, show "partial availability" to caller | 30 min |
| Owner quiet hours block SMS with no queue | SMS handler | Queue blocked SMS, send next morning | 1 hour |
| "unavailable" caller ID creates lead with empty phone | tool-handlers.ts | Validate phone has 10+ digits, mark as anonymous | 15 min |
| Reschedule makes Google Calendar API call inside DB transaction | tool-handlers.ts | Move API call outside transaction | 30 min |
| Speech confidence <0.5 rejected without confirmation | voice-owner route | Accept 0.3+ with "Did you say X?" confirmation | 30 min |
| Webhook returns 200 even when checkout handler crashes | stripe webhook | Only return 200 if handler succeeds; let Stripe retry on 500 | 30 min |

---

## Positioning Recommendations

### Stop Saying
- "AI receptionist" (commoditized, triggers price comparison with Rosie at $49)
- "Answering service" (commoditized, compared to Ruby/AnswerConnect)
- "Start Free Trial" (already in CLAUDE.md — good)

### Start Saying
- "AI front office" or "AI office manager" (implies CRM + booking + estimates + billing)
- "Your $35K/year receptionist, for $497/month" (salary comparison)
- "Books 2 extra jobs? It's free." (ROI framing)
- "The only AI that speaks Spanish as well as English" (bilingual moat)
- "Built for plumbers, HVAC techs, and electricians" (trade-specific, not generic)

### Target Persona
**NOT** solo operators (they'll pick Rosie at $49). **Target** 3-10 truck operations doing $500K-$2M/year who:
- Currently have spouse/part-timer answering phones
- Miss 30%+ of calls
- Know they're leaving $50K+ on the table
- Need after-hours coverage
- Serve Spanish-speaking markets

### Pricing Defense
When prospect says "Rosie is $149":
> "Rosie answers your phone. Capta runs your front office. You get a CRM, client portal, appointment booking, estimates, call QA scoring, owner SMS tools, and 20 features that Rosie doesn't have. At $497/mo, if Maria books just 2 jobs you would have missed, she's free."

---

## Implementation Priority

```
WEEK 1 — Stop the bleeding:
  P0-1: Call summary failure → owner notifications (CRITICAL)
  P0-2: Buffer time between appointments (CRITICAL)
  P0-3: Slot generation fix (HIGH)
  P0-4: Timezone bug (HIGH)
  P0-7: Email uniqueness check (MEDIUM)
  P0-8: Require services (MEDIUM)
  P0-9: Hardcoded "Maria" (LOW)
  Edge case fixes (batch)

WEEK 2 — Close the experience gaps:
  P0-5: Grace period service restriction
  P0-6: Voicemail processing
  P1-7: Call duration limit
  P2-9: Payment failure SMS
  P2-6: Call forwarding instructions
  P2-7: Annual plan upsell banner

WEEK 3-4 — Product completeness:
  P1-2: Dashboard i18n (Spanish)
  P1-5: Customer timeline
  P1-6: Calendar view
  P2-1: ROI calculator
  P2-2: Test call in setup
  P2-4: Customer merge

MONTH 2 — Revenue features:
  P1-3: Estimate delivery (PDF + email + SMS)
  P1-4: Estimate line items
  P1-1: Zapier integration (Phase 1)
  P2-3: Abandoned setup retargeting
  P2-5: Booking rate tracking
  P2-8: Appointment confirmation replies
  P2-10: Spam filtering

MONTH 3 — Strategic:
  P1-1: Native HCP/Jobber integration (Phase 2)
  P3-1: Emergency dispatch automation
  P3-2: Automated review solicitation
  P3-3: Lead scoring
  P1-1: ServiceTitan partner application (Phase 3)
```

---

## The Bottom Line

Capta has more features than any competitor at this price point. The problem isn't what's built — it's what's missing at the edges:

1. **Integration** — Without ServiceTitan/HCP/Jobber, you lose every prospect who uses FSM software
2. **Reliability** — Silent failures in call summaries, voicemail, and timezone handling erode trust
3. **Completeness** — Estimates without delivery, appointments without buffers, CRM without timelines
4. **Positioning** — Saying "AI receptionist" at $497 invites unfavorable comparison to $49 alternatives

Fix #1-3 and nail #4, and the $497/mo price point isn't just defensible — it's a steal.
