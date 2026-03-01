/**
 * Graceful integration availability checks.
 * Returns whether each external service is configured with valid API keys.
 * Use these before calling external APIs to avoid runtime crashes on missing keys.
 */

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

export function isHumeConfigured(): boolean {
  return !!(
    process.env.HUME_API_KEY &&
    process.env.HUME_SECRET_KEY &&
    process.env.HUME_CONFIG_ID
  );
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function isSentryConfigured(): boolean {
  return !!process.env.SENTRY_DSN;
}
