import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { setupSessions, prospects, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { cookies } from "next/headers";

const COOKIE_NAME = "capta_setup";

// Per-step Zod schemas
const stepSchemas: Record<number, z.ZodSchema> = {
  1: z.object({
    businessName: z.string().min(1).max(200),
    businessType: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(50),
    services: z.array(z.string().max(200)).min(1, "Add at least one service").max(30),
    timezone: z.string().max(50).optional(),
  }),
  2: z.object({
    ownerName: z.string().min(1).max(200),
    ownerEmail: z.string().email().max(320),
    ownerPhone: z.string().min(7).max(20),
  }),
  3: z.object({
    receptionistName: z.string().min(1).max(100),
  }),
  4: z.object({
    personalityPreset: z.enum(["professional", "friendly", "warm"]),
    voiceId: z.string().max(50).optional(),
  }),
  5: z.object({
    faqAnswers: z.record(z.string(), z.string().max(500)).optional(),
    offLimits: z.record(z.string(), z.boolean()).optional(),
  }),
  6: z.object({
    selectedPlan: z.enum(["monthly", "annual"]),
  }),
};

async function getSessionFromCookie(): Promise<{ token: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return { token };
}

/**
 * PUT /api/setup/step/[stepNumber]
 * Save step data for a setup session. Zod validated per step.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ stepNumber: string }> },
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-step:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  const { stepNumber: stepStr } = await params;
  const step = parseInt(stepStr, 10);
  if (isNaN(step) || step < 1 || step > 6) {
    return NextResponse.json({ error: "Invalid step number" }, { status: 400 });
  }

  const schema = stepSchemas[step];
  if (!schema) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(". ");
    return NextResponse.json(
      { error: messages },
      { status: 400 },
    );
  }

  // Get session from cookie
  const cookieData = await getSessionFromCookie();
  if (!cookieData) {
    return NextResponse.json({ error: "No session found" }, { status: 401 });
  }

  try {
    const [session] = await db
      .select()
      .from(setupSessions)
      .where(
        and(
          eq(setupSessions.token, cookieData.token),
          eq(setupSessions.status, "active"),
        ),
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const data = result.data as Record<string, unknown>;

    // Build update object based on step
    const updates: Record<string, unknown> = {
      currentStep: Math.max(step, session.currentStep),
      maxStepReached: Math.max(step, session.maxStepReached),
      lastActiveAt: now,
      updatedAt: now,
    };

    // Merge step-specific fields
    if (step === 1) {
      updates.businessName = data.businessName;
      updates.businessType = data.businessType;
      updates.city = data.city;
      updates.state = data.state;
      if (data.services) updates.services = data.services;
      if (data.timezone) updates.timezone = data.timezone;
    } else if (step === 2) {
      updates.ownerName = data.ownerName;
      updates.ownerEmail = data.ownerEmail;
      updates.ownerPhone = data.ownerPhone;
    } else if (step === 3) {
      updates.receptionistName = data.receptionistName;
    } else if (step === 4) {
      updates.personalityPreset = data.personalityPreset;
      if (data.voiceId) updates.voiceId = data.voiceId;
    } else if (step === 5) {
      if (data.faqAnswers) updates.faqAnswers = data.faqAnswers;
      if (data.offLimits) updates.offLimits = data.offLimits;
    } else if (step === 6) {
      updates.selectedPlan = data.selectedPlan;
    }

    await db
      .update(setupSessions)
      .set(updates)
      .where(eq(setupSessions.id, session.id));

    // Step 2: Check for existing business with this email
    if (step === 2) {
      const email = data.ownerEmail as string;
      const [existingBiz] = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.ownerEmail, email))
        .limit(1);
      if (existingBiz) {
        return NextResponse.json(
          { error: "An account with this email already exists.", loginUrl: "/dashboard/login" },
          { status: 409 },
        );
      }
    }

    // Step 2: Create/update prospect for retargeting
    if (step === 2) {
      await upsertProspect(session.id, {
        businessName: session.businessName || "Unknown Business",
        businessType: session.businessType || "other",
        city: session.city || undefined,
        state: session.state || undefined,
        ownerName: data.ownerName as string,
        ownerEmail: data.ownerEmail as string,
        ownerPhone: data.ownerPhone as string,
        language: session.language,
      });
    }

    return NextResponse.json({ success: true, step });
  } catch (err) {
    reportError(`[setup/step/${step}] Failed to save`, err);
    return NextResponse.json({ error: "Failed to save step" }, { status: 500 });
  }
}

async function upsertProspect(
  sessionId: string,
  data: {
    businessName: string;
    businessType: string;
    city?: string;
    state?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    language: string;
  },
) {
  try {
    // Check if prospect already exists for this email
    const [existing] = await db
      .select({ id: prospects.id })
      .from(prospects)
      .where(eq(prospects.email, data.ownerEmail))
      .limit(1);

    if (existing) {
      // Update existing prospect
      await db
        .update(prospects)
        .set({
          businessName: data.businessName,
          phone: data.ownerPhone,
          vertical: data.businessType,
          city: data.city,
          state: data.state,
          language: data.language,
          source: "setup_page",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(prospects.id, existing.id));

      // Link prospect to session
      await db
        .update(setupSessions)
        .set({ prospectId: existing.id })
        .where(eq(setupSessions.id, sessionId));
    } else {
      // Create new prospect
      const [prospect] = await db
        .insert(prospects)
        .values({
          businessName: data.businessName,
          email: data.ownerEmail,
          phone: data.ownerPhone,
          vertical: data.businessType,
          city: data.city,
          state: data.state,
          language: data.language,
          source: "setup_page",
          status: "new",
          leadScore: 30, // Higher because they started setup
        })
        .returning({ id: prospects.id });

      if (prospect) {
        await db
          .update(setupSessions)
          .set({ prospectId: prospect.id })
          .where(eq(setupSessions.id, sessionId));
      }
    }
  } catch (err) {
    reportError("[setup/step/2] Failed to upsert prospect", err);
  }
}
