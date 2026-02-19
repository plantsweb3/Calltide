import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Hume webhook HMAC signature.
 * Hume signs the raw body with HMAC-SHA256 using the secret key.
 */
export function verifyHumeSignature(
  rawBody: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const expected = createHmac("sha256", secretKey)
      .update(rawBody)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (sigBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
