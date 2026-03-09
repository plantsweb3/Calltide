import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { intakeAttachments, jobIntakes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const DEMO_BUSINESS_ID = "demo-business-id";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      totalPhotos: 0,
      totalIntakesWithPhotos: 0,
      averagePerLead: 0,
    });
  }

  try {
    const [stats] = await db
      .select({
        totalPhotos: sql<number>`count(*)`,
        totalIntakesWithPhotos: sql<number>`count(distinct ${intakeAttachments.jobIntakeId})`,
      })
      .from(intakeAttachments)
      .where(eq(intakeAttachments.businessId, businessId));

    const [intakeCount] = await db
      .select({ total: sql<number>`count(*)` })
      .from(jobIntakes)
      .where(
        and(
          eq(jobIntakes.businessId, businessId),
          eq(jobIntakes.intakeComplete, true),
        ),
      );

    const totalIntakes = intakeCount?.total ?? 0;
    const totalPhotos = stats?.totalPhotos ?? 0;
    const averagePerLead = totalIntakes > 0 ? Math.round((totalPhotos / totalIntakes) * 10) / 10 : 0;

    return NextResponse.json({
      totalPhotos,
      totalIntakesWithPhotos: stats?.totalIntakesWithPhotos ?? 0,
      averagePerLead,
    });
  } catch (error) {
    reportError("Failed to fetch photo stats", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
