import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength.
 * Requirements: min 8 chars, at least 1 letter, at least 1 number.
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Must be at least 8 characters");
  if (!/[a-zA-Z]/.test(password)) errors.push("Must contain at least one letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain at least one number");
  return { valid: errors.length === 0, errors };
}

/**
 * Get password strength level for UI indicator.
 * - weak: fails validation
 * - fair: passes validation (8+ chars, letter + number)
 * - strong: 12+ chars with letter + number + special char
 */
export function getPasswordStrength(password: string): "weak" | "fair" | "strong" {
  const { valid } = validatePassword(password);
  if (!valid) return "weak";
  if (password.length >= 12 && /[^a-zA-Z0-9]/.test(password)) return "strong";
  return "fair";
}

/**
 * SHA-256 hash a reset token before DB storage.
 */
export async function hashResetToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
