import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "calltide_admin";
const CLIENT_COOKIE = "calltide_client";

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

function parseClientPayload(cookie: string): string | null {
  const lastDot = cookie.lastIndexOf(".");
  if (lastDot === -1) return null;
  try {
    const data = JSON.parse(atob(cookie.slice(0, lastDot)));
    return data.businessId ?? null;
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

  return null;
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
  // GET requests to /api/blog/posts are public (used by blog pages)
  // POST/PATCH/DELETE require admin auth
  return method !== "GET";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes (pages + API) ──
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Allow auth endpoints through
    if (pathname === "/admin/login" || pathname === "/api/admin/auth" || pathname === "/api/admin/auth/logout") {
      return NextResponse.next();
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

  // ── Dashboard API routes ──
  if (pathname.startsWith("/api/dashboard")) {
    // Allow auth endpoints through without cookie
    if (pathname.startsWith("/api/dashboard/auth")) return NextResponse.next();

    const secret = process.env.CLIENT_AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    const cookie = req.cookies.get(CLIENT_COOKIE)?.value;
    if (!cookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const valid = await verifyToken(cookie, secret);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = parseClientPayload(cookie);
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const headers = new Headers(req.headers);
    headers.set("x-business-id", businessId);
    return NextResponse.next({ request: { headers } });
  }

  // ── Dashboard pages ──
  if (pathname.startsWith("/dashboard")) {
    if (pathname === "/dashboard/login") return NextResponse.next();

    const secret = process.env.CLIENT_AUTH_SECRET;
    if (!secret) {
      return NextResponse.redirect(new URL("/dashboard/login", req.url));
    }

    const cookie = req.cookies.get(CLIENT_COOKIE)?.value;
    if (!cookie) {
      return NextResponse.redirect(new URL("/dashboard/login", req.url));
    }

    const valid = await verifyToken(cookie, secret);
    if (!valid) {
      return NextResponse.redirect(new URL("/dashboard/login", req.url));
    }

    const businessId = parseClientPayload(cookie);
    if (!businessId) {
      return NextResponse.redirect(new URL("/dashboard/login", req.url));
    }

    const headers = new Headers(req.headers);
    headers.set("x-business-id", businessId);
    return NextResponse.next({ request: { headers } });
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
  ],
};
