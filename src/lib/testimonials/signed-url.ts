import crypto from "crypto";

export function buildTestimonialToken(businessId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`testimonial:${businessId}`).digest("hex");
}

export function verifyTestimonialToken(businessId: string, provided: string): boolean {
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) return false;
  const expected = buildTestimonialToken(businessId, secret);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/** Returns a signed testimonial URL, or null when CLIENT_AUTH_SECRET is unset. */
export function buildTestimonialUrl(baseUrl: string, businessId: string): string | null {
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) return null;
  const token = buildTestimonialToken(businessId, secret);
  return `${baseUrl}/api/testimonial/submit?businessId=${businessId}&token=${token}`;
}
