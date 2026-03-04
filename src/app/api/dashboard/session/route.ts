import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { verifyClientCookie } from "@/lib/client-auth";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("calltide_client")?.value;
    const secret = env.CLIENT_AUTH_SECRET;
    if (!cookie || !secret) {
      return NextResponse.json({ valid: false, reason: "no_session" });
    }

    const payload = await verifyClientCookie(cookie, secret);
    if (!payload) {
      return NextResponse.json({ valid: false, reason: "invalid_cookie" });
    }

    // If no accountId in cookie, we can't check password change — assume valid
    if (!payload.accountId) {
      return NextResponse.json({ valid: true });
    }

    const [account] = await db
      .select({ passwordChangedAt: accounts.passwordChangedAt })
      .from(accounts)
      .where(eq(accounts.id, payload.accountId))
      .limit(1);

    if (!account) {
      return NextResponse.json({ valid: true });
    }

    // If no iat in cookie (old cookies), assume valid for backwards compat
    if (!payload.iat) {
      return NextResponse.json({ valid: true });
    }

    // If password was changed after cookie was issued, session is invalid
    if (account.passwordChangedAt) {
      const changedAt = new Date(account.passwordChangedAt).getTime();
      if (payload.iat < changedAt) {
        return NextResponse.json({ valid: false, reason: "password_changed" });
      }
    }

    return NextResponse.json({ valid: true });
  } catch {
    // On error, don't block the user
    return NextResponse.json({ valid: true });
  }
}
