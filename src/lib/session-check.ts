import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a session is still valid after a password change.
 * Returns true if the session should be rejected (password was changed after session was issued).
 *
 * Call this in sensitive routes (settings, billing, account management).
 * Skips check gracefully if accountId or iat is missing (backwards compat with old cookies).
 */
export async function isSessionInvalidated(
  accountId: string | null | undefined,
  sessionIat: string | null | undefined,
): Promise<boolean> {
  if (!accountId || !sessionIat) return false;

  const iat = Number(sessionIat);
  if (!iat || isNaN(iat)) return false;

  try {
    const [account] = await db
      .select({ passwordChangedAt: accounts.passwordChangedAt })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (!account?.passwordChangedAt) return false;

    const changedAt = new Date(account.passwordChangedAt).getTime();
    return iat < changedAt;
  } catch {
    // On DB error, don't block the user
    return false;
  }
}
