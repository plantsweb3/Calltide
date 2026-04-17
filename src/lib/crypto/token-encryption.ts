import crypto from "crypto";

/**
 * Symmetric encryption for sensitive tokens stored at rest (e.g. third-party
 * OAuth refresh_tokens). Uses AES-256-GCM; each ciphertext includes a random
 * 96-bit IV and the 128-bit auth tag.
 *
 * Format: `enc:v1:<iv>:<tag>:<ciphertext>` — all base64url.
 *
 * Values that do not carry the `enc:v1:` prefix are returned as-is by
 * `decryptToken()` so that existing plaintext rows remain readable until the
 * next refresh cycle rewrites them encrypted.
 */

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.CLIENT_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY or CLIENT_AUTH_SECRET must be set to encrypt/decrypt tokens",
    );
  }
  // Derive a deterministic 32-byte key from the secret.
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptToken(value: string): string {
  if (!value.startsWith(PREFIX)) {
    // Legacy plaintext — return as-is. Will be rewritten on next refresh.
    return value;
  }
  const body = value.slice(PREFIX.length);
  const parts = body.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted token");
  }
  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(ctB64, "base64url");
  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
