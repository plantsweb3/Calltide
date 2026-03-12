import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions, businesses, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { signClientCookie } from "@/lib/client-auth";
import { hashPassword } from "@/lib/password";
import { reportError } from "@/lib/error-reporting";
import { createNotification } from "@/lib/notifications";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe/client";
import { getMrrForPlan, type PlanType } from "@/lib/stripe-prices";
import { createBusinessFromSetup } from "@/lib/onboarding/create-business";
import { sendWelcomeSms } from "@/lib/onboarding/welcome-sms";

const SETUP_COOKIE = "capta_setup";
const CLIENT_COOKIE = "capta_client";
const SESSION_30D = 30 * 24 * 60 * 60 * 1000;
const FALLBACK_THRESHOLD = 5; // Start checking Stripe directly after this many attempts

/**
 * POST /api/setup/auth
 *
 * After Stripe checkout completes, the setup flow calls this to:
 * 1. Verify the setup session is converted (has businessId)
 * 2. If not converted after several attempts, check Stripe directly (fallback)
 * 3. Generate a password for the account if none exists
 * 4. Set the capta_client cookie so the user can access /dashboard
 * 5. Return the businessId + generated password for the celebration screen
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-auth:${ip}`, { limit: 30, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  const cookieStore = await cookies();
  const setupToken = cookieStore.get(SETUP_COOKIE)?.value;
  if (!setupToken) {
    return NextResponse.json({ error: "No setup session" }, { status: 401 });
  }

  // Parse optional body (attempt count + session_id for Stripe fallback)
  let attempt = 0;
  let stripeSessionId: string | undefined;
  try {
    const body = await req.json().catch(() => null);
    if (body) {
      attempt = typeof body.attempt === "number" ? body.attempt : 0;
      stripeSessionId = typeof body.session_id === "string" ? body.session_id : undefined;
    }
  } catch {
    // No body is fine — backwards compatible
  }

  try {
    // Find the setup session
    const [session] = await db
      .select()
      .from(setupSessions)
      .where(
        and(
          eq(setupSessions.token, setupToken),
          eq(setupSessions.status, "converted"),
        ),
      )
      .limit(1);

    if (!session || !session.businessId) {
      // ── Stripe Fallback ──
      // If webhook hasn't converted the session after several attempts,
      // check Stripe directly and create the business ourselves
      if (attempt >= FALLBACK_THRESHOLD && stripeSessionId) {
        const fallbackResult = await tryStripeFallback(setupToken, stripeSessionId);
        if (fallbackResult) {
          // Fallback succeeded — continue to password generation below
          return await generateCredentialsAndRespond(fallbackResult.businessId, req);
        }
      }
      return NextResponse.json({ error: "Session not converted yet" }, { status: 404 });
    }

    return await generateCredentialsAndRespond(session.businessId, req);
  } catch (err) {
    reportError("[setup/auth] Failed to authenticate setup session", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

/**
 * Stripe fallback: verify payment directly with Stripe API and create business
 * if the webhook failed to fire.
 */
async function tryStripeFallback(
  setupToken: string,
  stripeSessionId: string,
): Promise<{ businessId: string } | null> {
  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId);

    // Verify payment was actually completed
    if (checkoutSession.payment_status !== "paid") {
      return null;
    }

    // Load the unconverted setup session
    const [setupSession] = await db
      .select()
      .from(setupSessions)
      .where(
        and(
          eq(setupSessions.token, setupToken),
          eq(setupSessions.status, "active"),
        ),
      )
      .limit(1);

    if (!setupSession) return null;

    // Verify the checkout session matches this setup session
    if (checkoutSession.metadata?.setupSessionId !== setupSession.id) {
      return null;
    }

    const customerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id;
    const subscriptionId =
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : (checkoutSession.subscription as { id: string } | null)?.id;
    const email =
      checkoutSession.customer_email || checkoutSession.metadata?.email;

    if (!customerId || !email) return null;

    const plan = (checkoutSession.metadata?.plan === "annual" ? "annual" : "monthly") as PlanType;
    const mrr = getMrrForPlan(plan);

    const result = await createBusinessFromSetup({
      setupSessionId: setupSession.id,
      customerId,
      subscriptionId: subscriptionId || undefined,
      email,
      plan,
      mrr,
      isFallback: true,
    });

    if (result) {
      // Alert admin that webhook fallback was used
      await createNotification({
        source: "incident",
        severity: "warning",
        title: "Webhook fallback activated",
        message: `Business created via Stripe fallback for ${email}. Stripe webhook may have failed — check STRIPE_WEBHOOK_SECRET configuration.`,
        actionUrl: "/admin/ops",
      });

      return { businessId: result.businessId };
    }

    return null;
  } catch (err) {
    reportError("[setup/auth] Stripe fallback failed", err);
    return null;
  }
}

/**
 * Generate password, set cookie, dispatch welcome SMS, and return credentials.
 */
async function generateCredentialsAndRespond(
  businessId: string,
  req: NextRequest,
): Promise<NextResponse> {
  // Load the business to get accountId
  const [biz] = await db
    .select({
      id: businesses.id,
      accountId: businesses.accountId,
      ownerEmail: businesses.ownerEmail,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz || !biz.accountId) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Generate a temporary password if the account doesn't have one
  let generatedPassword: string | null = null;
  const [account] = await db
    .select({ id: accounts.id, passwordHash: accounts.passwordHash })
    .from(accounts)
    .where(eq(accounts.id, biz.accountId))
    .limit(1);

  if (account && !account.passwordHash) {
    // Generate a random 12-char password
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    generatedPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => chars[b % chars.length])
      .join("");

    const hash = await hashPassword(generatedPassword);
    await db
      .update(accounts)
      .set({ passwordHash: hash, updatedAt: new Date().toISOString() })
      .where(eq(accounts.id, account.id));
  }

  // Dispatch welcome SMS (fire-and-forget)
  if (generatedPassword) {
    sendWelcomeSms(businessId, generatedPassword).catch((err) =>
      reportError("[setup/auth] Welcome SMS failed", err, { extra: { businessId } }),
    );
  }

  // Sign and set the client cookie
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const cookieValue = await signClientCookie(biz.id, secret, biz.accountId, SESSION_30D);

  const response = NextResponse.json({
    success: true,
    businessId: biz.id,
    email: biz.ownerEmail,
    generatedPassword,
  });

  response.cookies.set(CLIENT_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_30D / 1000,
    path: "/",
  });

  return response;
}
