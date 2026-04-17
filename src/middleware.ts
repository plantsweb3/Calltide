import { NextRequest, NextResponse } from "next/server";
import { rateLimit as sharedRateLimit } from "@/lib/rate-limit";

// Run middleware on Node.js runtime so we can use the Turso-backed rate limiter
// (shared across Vercel instances) instead of a per-instance in-memory Map.
export const runtime = "nodejs";

const ADMIN_COOKIE = "capta_admin";
const CLIENT_COOKIE = "capta_client";

// ── Constant-time string comparison (prevents timing attacks) ──
function constantTimeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let result = a.length ^ b.length; // non-zero if lengths differ
  for (let i = 0; i < maxLen; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

// ── Shared rate-limit configs (durable via Turso, cross-instance) ──
const RL = {
  voiceToken: { limit: 5, windowSeconds: 60 },
  admin: { limit: 200, windowSeconds: 60 },
  dashboard: { limit: 200, windowSeconds: 60 },
  smsOptout: { limit: 50, windowSeconds: 60 },
} as const;

async function checkRate(prefix: string, ip: string, cfg: { limit: number; windowSeconds: number }): Promise<boolean> {
  try {
    const result = await sharedRateLimit(`mw:${prefix}:${ip}`, cfg);
    return result.success;
  } catch {
    // If the shared limiter errors (e.g. DB down), fail open — availability over
    // strict rate limiting. Downstream per-route limits still apply.
    return true;
  }
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
}

function parseClientPayload(cookie: string): { businessId: string; accountId?: string; iat?: number } | null {
  const lastDot = cookie.lastIndexOf(".");
  if (lastDot === -1) return null;
  // Guard against oversized payloads (cookies are typically < 4KB)
  if (cookie.length > 8192) return null;
  try {
    const data = JSON.parse(atob(cookie.slice(0, lastDot)));
    if (data.exp && data.exp < Date.now()) return null;
    if (!data.businessId) return null;
    return { businessId: data.businessId, accountId: data.accountId, iat: data.iat };
  } catch {
    return null;
  }
}

/** Verify admin cookie and return error response if invalid, or null if OK. */
async function requireAdminAuth(req: NextRequest, isApi: boolean): Promise<NextResponse | null> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return isApi
      ? NextResponse.json({ error: "Auth not configured" }, { status: 500 })
      : NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!cookie) {
    return isApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const valid = await verifyToken(cookie, adminPassword);
  if (!valid) {
    return isApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Check admin token expiration — reject tokens without exp or with expired exp
  try {
    const lastDot = cookie.lastIndexOf(".");
    if (lastDot !== -1) {
      const data = JSON.parse(atob(cookie.slice(0, lastDot)));
      if (!data.exp || data.exp < Date.now()) {
        return isApi
          ? NextResponse.json({ error: "Session expired" }, { status: 401 })
          : NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }
  } catch {
    // Payload parsing failed — reject as expired (force re-login)
    return isApi
      ? NextResponse.json({ error: "Session expired" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return null;
}

/**
 * Verify client cookie and inject x-business-id / x-account-id headers.
 * Returns a NextResponse.next() with headers on success, or an error response.
 * For page routes, pass isApi=false to redirect to login instead of returning JSON.
 */
async function requireClientAuth(req: NextRequest, isApi: boolean): Promise<NextResponse> {
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) {
    return isApi
      ? NextResponse.json({ error: "Auth not configured" }, { status: 500 })
      : NextResponse.redirect(new URL("/dashboard/login", req.url));
  }

  const cookie = req.cookies.get(CLIENT_COOKIE)?.value;
  if (!cookie) {
    return isApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/dashboard/login", req.url));
  }

  const valid = await verifyToken(cookie, secret);
  if (!valid) {
    return isApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/dashboard/login", req.url));
  }

  const clientPayload = parseClientPayload(cookie);
  if (!clientPayload) {
    return isApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/dashboard/login", req.url));
  }

  const headers = new Headers(req.headers);
  headers.set("x-business-id", clientPayload.businessId);
  if (clientPayload.accountId) headers.set("x-account-id", clientPayload.accountId);
  if (clientPayload.iat) headers.set("x-session-iat", String(clientPayload.iat));
  return NextResponse.next({ request: { headers } });
}

/** Apply security headers to any response. */
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

/** Routes that require admin auth but aren't under /admin or /api/admin. */
function isProtectedInternalRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/prospects") ||
    pathname.startsWith("/api/demos") ||
    pathname.startsWith("/api/scrape") ||
    pathname === "/api/outreach/start" ||
    pathname === "/api/outreach/pause" ||
    pathname === "/api/audit/schedule" ||
    pathname.startsWith("/api/audit/call/") ||
    pathname.startsWith("/api/marketing/") ||
    pathname.startsWith("/api/content-queue") ||
    pathname.startsWith("/api/notifications") ||
    pathname === "/api/capacity/status"
  );
}

/** Blog post API routes that need admin auth for write methods only. */
function isBlogWriteRoute(pathname: string, method: string): boolean {
  if (!pathname.startsWith("/api/blog/posts")) return false;
  return method !== "GET";
}

export async function middleware(req: NextRequest) {
  const response = await middlewareCore(req);
  return withSecurityHeaders(response);
}

async function middlewareCore(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // ── CSRF protection for state-changing API requests ──
  // Exemptions: webhook endpoints (signature-verified), and the narrow set of
  // auth routes that must accept cross-origin bootstrap POSTs or carry their
  // own signed token in the URL (login, magic link verify, password reset).
  // Notably NOT exempt: logout, forgot-password, send-link — protecting those
  // prevents CSRF-triggered email spam and forced logout.
  const CSRF_EXEMPT_AUTH_ROUTES = new Set([
    "/api/admin/auth",
    "/api/dashboard/auth/login",
    "/api/dashboard/auth/demo",
    "/api/dashboard/auth/verify",
    "/api/dashboard/auth/reset-password",
  ]);

  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/webhooks/") &&
    !pathname.startsWith("/api/outreach/webhook/") &&
    !pathname.startsWith("/api/stripe/webhook") &&
    !CSRF_EXEMPT_AUTH_ROUTES.has(pathname) &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    // Enforce outside local development so preview/staging are protected too.
    const enforce = process.env.NODE_ENV !== "development";

    if (enforce) {
      if (!appUrl) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const normalizeOrigin = (u: string) =>
        u.replace(/\/+$/, "").replace(/^https?:\/\/www\./, (m) => m.replace("www.", ""));
      const normalizedApp = normalizeOrigin(appUrl);
      let allowed = false;
      if (origin) {
        allowed = normalizeOrigin(origin) === normalizedApp;
      } else if (referer) {
        try {
          allowed = normalizeOrigin(new URL(referer).origin) === normalizedApp;
        } catch {
          allowed = false;
        }
      }
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  // ── Admin routes (pages + API) ──
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname === "/api/admin/auth" || pathname === "/api/admin/auth/logout") {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/admin")) {
      if (!(await checkRate("admin", getIp(req), RL.admin))) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }
    const error = await requireAdminAuth(req, pathname.startsWith("/api/"));
    if (error) return error;
    return NextResponse.next();
  }

  // ── Internal API routes requiring admin auth ──
  if (isProtectedInternalRoute(pathname) || isBlogWriteRoute(pathname, req.method)) {
    const error = await requireAdminAuth(req, true);
    if (error) return error;
    return NextResponse.next();
  }

  // ── Outbound call route (cron secret OR valid session) ──
  if (pathname === "/api/outbound/call") {
    const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (cronSecret && process.env.CRON_SECRET && constantTimeEqual(cronSecret, process.env.CRON_SECRET)) return NextResponse.next();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminCookie = req.cookies.get(ADMIN_COOKIE)?.value;
    if (adminCookie && adminPassword && await verifyToken(adminCookie, adminPassword)) {
      return NextResponse.next();
    }
    return requireClientAuth(req, true);
  }

  // ── Compliance SMS opt-out webhook ──
  if (pathname === "/api/compliance/sms-optout") {
    if (!(await checkRate("sms-optout", getIp(req), RL.smsOptout))) {
      return new NextResponse("Too many requests", { status: 429 });
    }
    return NextResponse.next();
  }

  // ── Client-authenticated API routes ──
  if (
    pathname.startsWith("/api/receptionist") ||
    pathname.startsWith("/api/dashboard") ||
    pathname === "/api/stripe/portal" ||
    pathname === "/api/voice/token"
  ) {
    // Allow auth endpoints through without cookie
    if (pathname.startsWith("/api/dashboard/auth")) return NextResponse.next();

    // Rate limit dashboard API routes
    if (pathname.startsWith("/api/dashboard")) {
      if (!(await checkRate("dashboard", getIp(req), RL.dashboard))) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }

    // For /api/voice/token, apply strict rate limiting and also accept admin cookie
    if (pathname === "/api/voice/token") {
      if (!(await checkRate("voice-token", getIp(req), RL.voiceToken))) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminCookie = req.cookies.get(ADMIN_COOKIE)?.value;
      if (adminCookie && adminPassword && await verifyToken(adminCookie, adminPassword)) {
        return NextResponse.next();
      }
    }

    return requireClientAuth(req, true);
  }

  // ── Dashboard pages ──
  if (pathname.startsWith("/dashboard")) {
    if (
      pathname === "/dashboard/login" ||
      pathname === "/dashboard/forgot-password" ||
      pathname === "/dashboard/reset-password"
    ) return NextResponse.next();

    return requireClientAuth(req, false);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/api/dashboard/:path*",
    "/api/prospects/:path*",
    "/api/demos/:path*",
    "/api/scrape/:path*",
    "/api/outreach/start",
    "/api/outreach/pause",
    "/api/audit/schedule",
    "/api/audit/call/:path*",
    "/api/blog/posts",
    "/api/blog/posts/:path*",
    "/api/marketing/:path*",
    "/api/content-queue",
    "/api/content-queue/:path*",
    "/api/notifications",
    "/api/notifications/:path*",
    "/api/receptionist/:path*",
    "/api/stripe/portal",
    "/api/voice/token",
    "/api/outbound/call",
    "/api/compliance/sms-optout",
    "/api/capacity/status",
  ],
};
