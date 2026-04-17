import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { accounts, businesses, calls, appointments } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { assignReferralCode } from "@/lib/referral";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  ownerName: z.string().min(1).max(200),
  ownerPhone: z.string().min(1).max(20),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  twilioNumber: z.string().min(1).max(20),
  services: z.array(z.string()).optional(),
  businessHours: z.record(z.string(), z.object({ open: z.string(), close: z.string() })).optional(),
  timezone: z.string().max(50).optional(),
  defaultLanguage: z.enum(["en", "es"]).optional(),
  greeting: z.string().max(500).optional(),
});

export async function GET() {
  const [businessRows, accountRows, callStatsRows, aptStatsRows] = await Promise.all([
    db.select().from(businesses).limit(10000),
    db.select().from(accounts).limit(10000),
    db.select({
      businessId: calls.businessId,
      totalCalls: sql<number>`count(*)`,
      completedCalls: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
      missedCalls: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
    }).from(calls).groupBy(calls.businessId).limit(10000),
    db.select({
      businessId: appointments.businessId,
      totalAppointments: sql<number>`count(*)`,
      confirmed: sql<number>`sum(case when ${appointments.status} = 'confirmed' then 1 else 0 end)`,
      completed: sql<number>`sum(case when ${appointments.status} = 'completed' then 1 else 0 end)`,
    }).from(appointments).groupBy(appointments.businessId).limit(10000),
  ]);

  const accountMap = new Map(accountRows.map((a) => [a.id, a]));
  const callStatsMap = new Map(callStatsRows.map((c) => [c.businessId, c]));
  const aptStatsMap = new Map(aptStatsRows.map((a) => [a.businessId, a]));

  const results = businessRows.map((biz) => {
    const callStats = callStatsMap.get(biz.id);
    const aptStats = aptStatsMap.get(biz.id);

    const total = callStats?.totalCalls ?? 0;
    const completed = callStats?.completedCalls ?? 0;
    const rate = total > 0 ? completed / total : 1;
    const health = rate > 0.5 ? "green" : rate > 0.25 ? "amber" : "red";

    return {
      id: biz.id,
      name: biz.name,
      type: biz.type,
      ownerName: biz.ownerName,
      ownerPhone: biz.ownerPhone,
      active: biz.active,
      planType: biz.planType ?? "monthly",
      mrr: biz.mrr ?? 49700,
      createdAt: biz.createdAt,
      accountId: biz.accountId,
      locationName: biz.locationName,
      isPrimaryLocation: biz.isPrimaryLocation,
      calls: callStats ?? { totalCalls: 0, completedCalls: 0, missedCalls: 0 },
      appointments: aptStats ?? { totalAppointments: 0, confirmed: 0, completed: 0 },
      health,
    };
  });

  // Group by accountId
  const accountGroups: Record<string, {
    account: { id: string; companyName: string | null; ownerName: string; ownerEmail: string; locationCount: number; planType: string };
    locations: typeof results;
  }> = {};

  const ungrouped: typeof results = [];

  for (const biz of results) {
    if (biz.accountId && accountMap.has(biz.accountId)) {
      if (!accountGroups[biz.accountId]) {
        const acct = accountMap.get(biz.accountId)!;
        accountGroups[biz.accountId] = {
          account: {
            id: acct.id,
            companyName: acct.companyName,
            ownerName: acct.ownerName,
            ownerEmail: acct.ownerEmail,
            locationCount: acct.locationCount ?? 1,
            planType: acct.planType ?? "monthly",
          },
          locations: [],
        };
      }
      accountGroups[biz.accountId].locations.push(biz);
    } else {
      ungrouped.push(biz);
    }
  }

  return NextResponse.json({
    accounts: Object.values(accountGroups),
    ungrouped,
    // Flat list for backward compatibility
    businesses: results,
  });
}

const DEFAULT_HOURS: Record<string, { open: string; close: string }> = {
  monday: { open: "08:00", close: "17:00" },
  tuesday: { open: "08:00", close: "17:00" },
  wednesday: { open: "08:00", close: "17:00" },
  thursday: { open: "08:00", close: "17:00" },
  friday: { open: "08:00", close: "17:00" },
  saturday: { open: "closed", close: "closed" },
  sunday: { open: "closed", close: "closed" },
};

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`admin-clients-create:${getClientIp(req)}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const { name, type, ownerName, ownerPhone, ownerEmail, twilioNumber, services, businessHours, timezone, defaultLanguage, greeting } = parsed.data;

  const [created] = await db
    .insert(businesses)
    .values({
      name,
      type,
      ownerName,
      ownerPhone,
      ownerEmail: ownerEmail || null,
      twilioNumber,
      services: services || [],
      businessHours: businessHours || DEFAULT_HOURS,
      timezone: timezone || "America/Chicago",
      defaultLanguage: defaultLanguage || "en",
      greeting: greeting || null,
    })
    .returning();

  // Generate referral code for the new business
  assignReferralCode(created.id, created.name).catch((err) =>
    reportError("Failed to assign referral code", err)
  );

  return NextResponse.json(created, { status: 201 });
}
