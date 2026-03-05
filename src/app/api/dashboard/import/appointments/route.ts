import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, customers, leads } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { parseCsv, mapColumns, type ColumnMapping, type ImportResult } from "@/lib/import/csv-parser";
import { normalizePhone } from "@/lib/compliance/sms";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../../demo-data";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface AppointmentRow {
  customer_phone: string;
  customer_name: string;
  date: string;
  time: string;
  service: string;
  duration: string;
  notes: string;
  status: string;
}

const COLUMN_MAPPINGS: ColumnMapping<AppointmentRow>[] = [
  {
    field: "customer_phone",
    aliases: ["customer_phone", "phone", "phone_number", "cell", "mobile", "telephone", "client_phone", "telefono"],
    required: true,
  },
  {
    field: "customer_name",
    aliases: ["customer_name", "name", "client_name", "contact_name", "full_name", "nombre"],
  },
  {
    field: "date",
    aliases: ["date", "appointment_date", "scheduled_date", "fecha"],
    required: true,
  },
  {
    field: "time",
    aliases: ["time", "appointment_time", "scheduled_time", "start_time", "hora"],
    required: true,
  },
  {
    field: "service",
    aliases: ["service", "service_type", "type", "job_type", "work_type", "servicio"],
    required: true,
  },
  {
    field: "duration",
    aliases: ["duration", "duration_minutes", "length", "minutes", "duracion"],
  },
  {
    field: "notes",
    aliases: ["notes", "note", "comments", "comment", "description", "notas"],
  },
  {
    field: "status",
    aliases: ["status", "estado"],
  },
];

const VALID_STATUSES = new Set(["confirmed", "cancelled", "completed", "no_show"]);

/**
 * Parse date strings in common formats to ISO date (YYYY-MM-DD).
 */
function isValidDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function parseDate(val: string): string | null {
  // YYYY-MM-DD
  const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    if (!isValidDate(parseInt(y), parseInt(m), parseInt(d))) return null;
    return val;
  }

  // MM/DD/YYYY
  const mdyFull = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyFull) {
    const [, m, d, y] = mdyFull;
    if (!isValidDate(parseInt(y), parseInt(m), parseInt(d))) return null;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // M/D/YY
  const mdyShort = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdyShort) {
    const [, m, d, y] = mdyShort;
    const fullYear = parseInt(y) > 50 ? 1900 + parseInt(y) : 2000 + parseInt(y);
    if (!isValidDate(fullYear, parseInt(m), parseInt(d))) return null;
    return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

/**
 * Parse time strings to 24h format (HH:MM).
 */
function parseTime(val: string): string | null {
  // Already 24h: 14:00
  const match24 = val.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1]);
    const min = parseInt(match24[2]);
    if (hour > 23 || min > 59) return null;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  // 12h: 2:00 PM
  const match12 = val.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (match12) {
    const [, h, m, period] = match12;
    let hour = parseInt(h);
    const min = parseInt(m);
    if (hour < 1 || hour > 12 || min > 59) return null;
    if (period.toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (period.toLowerCase() === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ imported: 3, skipped: 0, errors: [] });
  }

  const rl = await rateLimit(`import:appointments:${businessId}`, { limit: 5, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 });
    }

    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json({ error: "CSV must have headers and at least 1 data row" }, { status: 400 });
    }

    // Pre-load existing customers and leads for this business
    const existingCustomers = await db
      .select({ id: customers.id, phone: customers.phone })
      .from(customers)
      .where(eq(customers.businessId, businessId));

    const customerByPhone = new Map<string, string>();
    for (const c of existingCustomers) {
      customerByPhone.set(normalizePhone(c.phone), c.id);
    }

    const existingLeads = await db
      .select({ id: leads.id, phone: leads.phone })
      .from(leads)
      .where(eq(leads.businessId, businessId));

    const leadByPhone = new Map<string, string>();
    for (const l of existingLeads) {
      leadByPhone.set(normalizePhone(l.phone), l.id);
    }

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const { data, missing } = mapColumns(headers, rows[i], COLUMN_MAPPINGS);

      if (missing.length > 0) {
        result.errors.push({ row: rowNum, reason: `Missing required fields: ${missing.join(", ")}` });
        continue;
      }

      const normalizedPhone = normalizePhone(data.customer_phone!);
      if (!normalizedPhone || normalizedPhone.length < 10) {
        result.errors.push({ row: rowNum, reason: "Invalid phone number" });
        continue;
      }

      const parsedDate = parseDate(data.date!);
      if (!parsedDate) {
        result.errors.push({ row: rowNum, reason: `Invalid date format: "${data.date}". Use MM/DD/YYYY or YYYY-MM-DD` });
        continue;
      }

      const parsedTime = parseTime(data.time!);
      if (!parsedTime) {
        result.errors.push({ row: rowNum, reason: `Invalid time format: "${data.time}". Use HH:MM or H:MM AM/PM` });
        continue;
      }

      // Resolve or create lead
      let leadId = leadByPhone.get(normalizedPhone);
      if (!leadId) {
        try {
          const [newLead] = await db.insert(leads).values({
            businessId,
            phone: normalizedPhone,
            name: data.customer_name || null,
            source: "csv_import",
          }).returning();
          leadId = newLead.id;
          leadByPhone.set(normalizedPhone, leadId);
        } catch (err) {
          reportError("Failed to create lead during appointment import", err, { businessId });
          result.errors.push({ row: rowNum, reason: "Failed to create lead record" });
          continue;
        }
      }

      const status = data.status && VALID_STATUSES.has(data.status.toLowerCase())
        ? data.status.toLowerCase()
        : "confirmed";

      const rawDuration = data.duration ? parseInt(data.duration, 10) : 60;
      const duration = isNaN(rawDuration) || rawDuration < 5 || rawDuration > 1440 ? 60 : rawDuration;

      try {
        await db.insert(appointments).values({
          businessId,
          leadId,
          service: data.service!,
          date: parsedDate,
          time: parsedTime,
          duration,
          status,
          notes: data.notes || null,
        });
        result.imported++;
      } catch (err) {
        reportError("Failed to import appointment row", err, { businessId });
        result.errors.push({ row: rowNum, reason: "Database error" });
      }
    }

    await logActivity({
      type: "csv_import",
      entityType: "appointment",
      title: `Imported ${result.imported} appointments from CSV`,
      detail: `${result.skipped} skipped, ${result.errors.length} errors, ${rows.length} total rows`,
      metadata: { businessId },
    });

    return NextResponse.json(result);
  } catch (error) {
    reportError("Appointment CSV import failed", error, { businessId });
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
