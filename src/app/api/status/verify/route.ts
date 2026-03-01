import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { statusPageSubscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`status-verify:${getClientIp(req)}`, { limit: 10, windowSeconds: 900 });
  if (!rl.success) {
    return NextResponse.redirect(new URL("/status?verified=false", env.NEXT_PUBLIC_APP_URL));
  }

  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/status?verified=false", env.NEXT_PUBLIC_APP_URL));
  }

  const [subscriber] = await db
    .select()
    .from(statusPageSubscribers)
    .where(eq(statusPageSubscribers.verificationToken, token))
    .limit(1);

  if (!subscriber) {
    return NextResponse.redirect(new URL("/status?verified=false", env.NEXT_PUBLIC_APP_URL));
  }

  await db
    .update(statusPageSubscribers)
    .set({ verified: true, verificationToken: null })
    .where(eq(statusPageSubscribers.id, subscriber.id));

  const lang = subscriber.language === "es" ? "/es" : "";
  return NextResponse.redirect(new URL(`${lang}/status?verified=true`, env.NEXT_PUBLIC_APP_URL));
}
