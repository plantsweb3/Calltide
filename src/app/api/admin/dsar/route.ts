import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { dataDeletionRequests } from "@/db/schema";
import { desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const createSchema = z.object({
  requestedBy: z.string().min(1).max(200),
  requestType: z.enum(["gdpr", "ccpa", "manual", "offboarding"]),
  dataDescription: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`dsar-list:${ip}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const parsedPage = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const parsedLimit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(1, Number.isNaN(parsedLimit) ? 20 : parsedLimit), 50);
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(dataDeletionRequests)
      .orderBy(desc(dataDeletionRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ requests: rows, page, limit });
  } catch (error) {
    reportError("Failed to list DSAR requests", error);
    return NextResponse.json({ error: "Failed to list requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`dsar-create:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = createSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    const [created] = await db
      .insert(dataDeletionRequests)
      .values({
        requestedBy: result.data.requestedBy,
        requestType: result.data.requestType,
        dataDescription: result.data.dataDescription || null,
        status: "received",
      })
      .returning();

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    reportError("Failed to create DSAR request", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
