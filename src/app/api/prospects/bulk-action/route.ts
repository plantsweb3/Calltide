import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import { startOutreachForProspect } from "@/lib/outreach/orchestrator";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ids, action, status: newStatus } = body as {
    ids: string[];
    action: string;
    status?: string;
  };

  if (!ids?.length || !action) {
    return NextResponse.json(
      { error: "ids and action are required" },
      { status: 400 },
    );
  }

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
