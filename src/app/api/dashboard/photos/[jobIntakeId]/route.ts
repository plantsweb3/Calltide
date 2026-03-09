import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { intakeAttachments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const DEMO_BUSINESS_ID = "demo-business-id";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobIntakeId: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobIntakeId } = await params;

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ attachments: [], total: 0 });
  }

  try {
    const attachments = await db
      .select()
      .from(intakeAttachments)
      .where(
        and(
          eq(intakeAttachments.businessId, businessId),
          eq(intakeAttachments.jobIntakeId, jobIntakeId),
        ),
      )
      .orderBy(desc(intakeAttachments.createdAt));

    return NextResponse.json({
      attachments,
      total: attachments.length,
    });
  } catch (error) {
    reportError("Failed to fetch intake photos", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}
