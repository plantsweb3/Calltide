import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import { startOutreachForProspect } from "@/lib/outreach/orchestrator";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(["change_status", "start_outreach", "export"]),
  status: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`bulk-action:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bulkActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const { ids, action, status: newStatus } = parsed.data;

  switch (action) {
    case "change_status": {
      if (!newStatus) {
        return NextResponse.json(
          { error: "status is required for change_status" },
          { status: 400 },
        );
      }
      await db
        .update(prospects)
        .set({ status: newStatus, updatedAt: new Date().toISOString() })
        .where(inArray(prospects.id, ids));

      await logActivity({
        type: "bulk_status_change",
        title: `Bulk status change to ${newStatus}`,
        detail: `${ids.length} prospects`,
      });
      return NextResponse.json({ success: true, updated: ids.length });
    }

    case "start_outreach": {
      const results = [];
      for (const id of ids) {
        const result = await startOutreachForProspect(id);
        results.push({ id, ...result });
      }
      return NextResponse.json({ success: true, results });
    }

    case "export": {
      const rows = await db
        .select()
        .from(prospects)
        .where(inArray(prospects.id, ids));

      const headers = [
        "business_name",
        "phone",
        "email",
        "website",
        "address",
        "city",
        "state",
        "vertical",
        "status",
        "audit_result",
        "lead_score",
      ];
      const csvLines = [headers.join(",")];

      for (const row of rows) {
        csvLines.push(
          [
            row.businessName,
            row.phone ?? "",
            row.email ?? "",
            row.website ?? "",
            row.address ?? "",
            row.city ?? "",
            row.state ?? "",
            row.vertical ?? "",
            row.status,
            row.auditResult ?? "",
            row.leadScore?.toString() ?? "",
          ]
            .map((v) => `"${v.replace(/"/g, '""')}"`)
            .join(","),
        );
      }

      return new Response(csvLines.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=prospects.csv",
        },
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
