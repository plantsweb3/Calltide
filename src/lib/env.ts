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

  // Phase 2: Outreach Engine (optional)
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
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
