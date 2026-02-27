import { z } from "zod";

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),

  HUME_API_KEY: z.string().min(1),
  HUME_SECRET_KEY: z.string().min(1),
  HUME_CONFIG_ID: z.string().min(1),

  ANTHROPIC_API_KEY: z.string().min(1),

  TWILIO_ACCOUNT_SID: z.string().startsWith("AC"),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().startsWith("+"),

  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Landing page / marketing
  NEXT_PUBLIC_PHONE: z.string().min(1).optional(),        // Display format: "(830) 521-7133"
  NEXT_PUBLIC_PHONE_TEL: z.string().min(1).optional(),    // tel: format: "+18305217133"
  NEXT_PUBLIC_BOOKING_URL: z.string().url().optional(),   // e.g. "https://cal.com/calltide/onboarding"
  NEXT_PUBLIC_MARKETING_URL: z.string().url().optional(), // e.g. "https://calltide.app"
  NEXT_PUBLIC_HUME_CONFIG_ID: z.string().min(1).optional(),

  // Outreach email sender
  OUTREACH_FROM_EMAIL: z.string().min(1).optional(),      // e.g. "Calltide <hello@contact.calltide.app>"

  // AI model
  CLAUDE_MODEL: z.string().min(1).optional(),             // defaults to claude-sonnet-4-5-20250929
  CLM_API_KEY: z.string().min(16).optional(),             // Auth key for Hume EVI CLM endpoint

  // Owner contact
  OWNER_EMAIL: z.string().email(),
  OWNER_PHONE: z.string().min(10),

  // Cron + Webhooks
  CRON_SECRET: z.string().min(16),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),    // SVIX secret for Resend webhook verification

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_ID: z.string().min(1).optional(),

  // Phase 2: Outreach Engine (optional)
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(8),
  CLIENT_AUTH_SECRET: z.string().min(16),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  // Skip validation during build (Next.js sets this during `next build`)
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return process.env as unknown as Env;
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Warn but don't crash — allows partial env configs (e.g. placeholder keys)
    console.warn("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  }
  return (parsed.success ? parsed.data : process.env) as Env;
}

export const env = getEnv();
