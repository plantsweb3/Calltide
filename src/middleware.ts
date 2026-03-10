import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "capta_admin";
const CLIENT_COOKIE = "capta_client";

// ── Constant-time string comparison (Edge-compatible, prevents timing attacks) ──
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ── Lightweight rate limiter for middleware (Edge-compatible) ──
const rlStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW = 60_000;

function rateLimit(ip: string, prefix: string, limit: number): boolean {
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const entry = rlStore.get(key);
  if (!entry || entry.resetAt < now) {
    rlStore.set(key, { count: 1, resetAt: now + RL_WINDOW });
    return true;
  }
  entry.count++;
  if (entry.count > limit) return false;
  return true;
}

const HUME_TOKEN_RL_LIMIT = 5; // strict limit for token endpoint
const ADMIN_RL_LIMIT = 200;
const DASHBOARD_RL_LIMIT = 200; // higher — dashboards make many parallel fetches

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

function parseClientPayload(cookie: string): { businessId: string; accountId?: string } | null {
  const lastDot = cookie.lastIndexOf(".");
  if (lastDot === -1) return null;
  try {
    const data = JSON.parse(atob(cookie.slice(0, lastDot)));
    if (data.exp && data.exp < Date.now()) return null;
    if (!data.businessId) return null;
    return { businessId: data.businessId, accountId: data.accountId };
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

  // Check admin token expiration (if present — backwards compatible with old tokens)
  try {
    const lastDot = cookie.lastIndexOf(".");
    if (lastDot !== -1) {
      const data = JSON.parse(atob(cookie.slice(0, lastDot)));
      if (data.exp && data.exp < Date.now()) {
        return isApi
          ? NextResponse.json({ error: "Session expired" }, { status: 401 })
          : NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }
  } catch {
    // Non-fatal: if payload parsing fails, token is still HMAC-verified
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
    pathname.startsWith("/api/notifications")
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
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/webhooks/") &&
    !pathname.startsWith("/api/outreach/webhook/") &&
    !pathname.startsWith("/api/stripe/webhook") &&
    !pathname.startsWith("/api/admin/auth") &&
    !pathname.startsWith("/api/dashboard/auth") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    const origin = req.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (origin && appUrl) {
      const normalizeOrigin = (u: string) => u.replace(/\/+$/, "").replace(/^https?:\/\/www\./, (m) => m.replace("www.", ""));
      if (normalizeOrigin(origin) !== normalizeOrigin(appUrl)) {
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
      if (!rateLimit(getIp(req), "admin", ADMIN_RL_LIMIT)) {
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
    if (!rateLimit(getIp(req), "sms-optout", 50)) {
      return new NextResponse("Too many requests", { status: 429 });
    }
    return NextResponse.next();
  }

  // ── Client-authenticated API routes ──
  if (
    pathname.startsWith("/api/receptionist") ||
    pathname.startsWith("/api/dashboard") ||
    pathname === "/api/stripe/portal" ||
    pathname === "/api/hume/token"
  ) {
    // Allow auth endpoints through without cookie
    if (pathname.startsWith("/api/dashboard/auth")) return NextResponse.next();

    // Rate limit dashboard API routes
    if (pathname.startsWith("/api/dashboard")) {
      if (!rateLimit(getIp(req), "dashboard", DASHBOARD_RL_LIMIT)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }

    // For /api/hume/token, apply strict rate limiting and also accept admin cookie
    if (pathname === "/api/hume/token") {
      if (!rateLimit(getIp(req), "hume-token", HUME_TOKEN_RL_LIMIT)) {
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
    "/api/hume/token",
    "/api/outbound/call",
    "/api/compliance/sms-optout",
  ],
};
