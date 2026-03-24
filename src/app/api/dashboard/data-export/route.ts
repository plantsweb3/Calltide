import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, customers, appointments, invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

const EXPORT_RATE_LIMIT = { limit: 5, windowSeconds: 3600 }; // 5 per hour

type ExportType = "calls" | "customers" | "appointments" | "invoices" | "all";

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function formatDate(dateStr: string | null, timezone: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { timeZone: timezone });
  } catch {
    return dateStr;
  }
}

async function exportCalls(businessId: string, timezone: string): Promise<string> {
  const records = await db
    .select()
    .from(calls)
    .where(eq(calls.businessId, businessId))
    .orderBy(desc(calls.createdAt))
    .limit(10000);

  const headers = [
    "Date", "Direction", "Caller Phone", "Status", "Duration (sec)",
    "Language", "Outcome", "Sentiment", "Summary", "After Hours",
  ];

  const rows = records.map((r) => [
    formatDate(r.createdAt, timezone),
    r.direction,
    r.callerPhone || "",
    r.status,
    String(r.duration ?? ""),
    r.language || "",
    r.outcome || "",
    r.sentiment || "",
    r.summary || "",
    r.isAfterHours ? "Yes" : "No",
  ]);

  return toCSV(headers, rows);
}

async function exportCustomers(businessId: string, timezone: string): Promise<string> {
  const records = await db
    .select()
    .from(customers)
    .where(eq(customers.businessId, businessId))
    .orderBy(desc(customers.createdAt))
    .limit(10000);

  const headers = [
    "Name", "Phone", "Email", "Address", "Language", "Source",
    "Total Calls", "Total Appointments", "Lifetime Value ($)",
    "Lead Score", "Tier", "Tags", "First Call", "Last Call", "Created",
  ];

  const rows = records.map((r) => [
    r.name || "",
    r.phone,
    r.email || "",
    r.address || "",
    r.language || "",
    r.source || "",
    String(r.totalCalls ?? 0),
    String(r.totalAppointments ?? 0),
    String(r.lifetimeValue ? (r.lifetimeValue / 100).toFixed(2) : "0.00"),
    String(r.leadScore ?? 0),
    r.tier || "",
    Array.isArray(r.tags) ? r.tags.join("; ") : "",
    formatDate(r.firstCallAt, timezone),
    formatDate(r.lastCallAt, timezone),
    formatDate(r.createdAt, timezone),
  ]);

  return toCSV(headers, rows);
}

async function exportAppointments(businessId: string, timezone: string): Promise<string> {
  const records = await db
    .select()
    .from(appointments)
    .where(eq(appointments.businessId, businessId))
    .orderBy(desc(appointments.createdAt))
    .limit(10000);

  const headers = [
    "Date", "Time", "Service", "Status", "Duration (min)",
    "Notes", "Reminder Sent", "Created",
  ];

  const rows = records.map((r) => [
    r.date,
    r.time,
    r.service,
    r.status,
    String(r.duration ?? 60),
    r.notes || "",
    r.reminderSent ? "Yes" : "No",
    formatDate(r.createdAt, timezone),
  ]);

  return toCSV(headers, rows);
}

async function exportInvoices(businessId: string, timezone: string): Promise<string> {
  const records = await db
    .select()
    .from(invoices)
    .where(eq(invoices.businessId, businessId))
    .orderBy(desc(invoices.createdAt))
    .limit(10000);

  const headers = [
    "Invoice Number", "Amount ($)", "Status", "Due Date",
    "Paid At", "Payment Method", "Subtotal ($)", "Tax Rate (%)",
    "Tax Amount ($)", "Notes", "Created",
  ];

  const rows = records.map((r) => [
    r.invoiceNumber || "",
    String(r.amount?.toFixed(2) ?? "0.00"),
    r.status,
    r.dueDate || "",
    formatDate(r.paidAt, timezone),
    r.paymentMethod || "",
    String(r.subtotal?.toFixed(2) ?? ""),
    String(r.taxRate ?? ""),
    String(r.taxAmount?.toFixed(2) ?? ""),
    r.notes || "",
    formatDate(r.createdAt, timezone),
  ]);

  return toCSV(headers, rows);
}

/**
 * GET /api/dashboard/data-export?type=calls|customers|appointments|invoices|all
 * Returns a CSV file for download. Rate limited to 5 per hour.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`data-export:${businessId}`, EXPORT_RATE_LIMIT);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "all") as ExportType;

  if (!["calls", "customers", "appointments", "invoices", "all"].includes(type)) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  try {
    // Get business timezone
    const [biz] = await db
      .select({ timezone: businesses.timezone })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const timezone = biz?.timezone || "America/Chicago";

    let csv: string;
    let filename: string;
    const dateStr = new Date().toISOString().split("T")[0];

    if (type === "all") {
      // Combine all exports into a single multi-section CSV
      const sections = [
        `--- CALLS ---\n${await exportCalls(businessId, timezone)}`,
        `\n\n--- CUSTOMERS ---\n${await exportCustomers(businessId, timezone)}`,
        `\n\n--- APPOINTMENTS ---\n${await exportAppointments(businessId, timezone)}`,
        `\n\n--- INVOICES ---\n${await exportInvoices(businessId, timezone)}`,
      ];
      csv = sections.join("");
      filename = `capta-export-all-${dateStr}.csv`;
    } else {
      switch (type) {
        case "calls":
          csv = await exportCalls(businessId, timezone);
          break;
        case "customers":
          csv = await exportCustomers(businessId, timezone);
          break;
        case "appointments":
          csv = await exportAppointments(businessId, timezone);
          break;
        case "invoices":
          csv = await exportInvoices(businessId, timezone);
          break;
        default:
          csv = "";
      }
      filename = `capta-${type}-${dateStr}.csv`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    reportError("Data export failed", err, { businessId });
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
