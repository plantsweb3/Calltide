import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`signup-start:${getClientIp(req)}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email } = result.data;

  // Check if a business with this email already exists
  const [existing] = await db
    .select({ id: businesses.id, ownerEmail: businesses.ownerEmail })
    .from(businesses)
    .where(eq(businesses.ownerEmail, email))
    .limit(1);

  if (existing) {
    // Rate limiting (10/hr per IP) prevents enumeration at scale.
    // Return 409 so the form can direct users to login instead.
    return NextResponse.json(
      { error: "exists" },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, email });
}
