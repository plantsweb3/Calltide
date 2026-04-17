import crypto from "crypto";

/**
 * Signed unsubscribe tokens for outreach emails. Prevents drive-by CSRF
 * unsubscribe by anyone who guesses a businessId.
 */
function buildUnsubToken(scope: "paywall", businessId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`unsub:${scope}:${businessId}`).digest("hex");
}

export function buildPaywallUnsubscribeUrl(baseUrl: string, businessId: string): string | null {
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) return null;
  const token = buildUnsubToken("paywall", businessId, secret);
  return `${baseUrl}/api/outreach/paywall-unsubscribe/${businessId}?t=${token}`;
}

export function verifyPaywallUnsubscribeToken(businessId: string, provided: string): boolean {
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) return false;
  const expected = buildUnsubToken("paywall", businessId, secret);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
