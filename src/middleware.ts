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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes ──
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return NextResponse.next();

    const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!cookie) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const valid = await verifyToken(cookie, adminPassword);
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  // ── Dashboard routes ──
  if (pathname.startsWith("/dashboard")) {
    // Allow login page and auth API routes through
    if (pathname === "/dashboard/login") return NextResponse.next();
    if (pathname.startsWith("/api/dashboard/auth")) return NextResponse.next();

    const secret = process.env.CLIENT_AUTH_SECRET;
    if (!secret) return NextResponse.next();

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

    // Inject business ID into request headers for downstream API routes
    const headers = new Headers(req.headers);
    headers.set("x-business-id", businessId);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
