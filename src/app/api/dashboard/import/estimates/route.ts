import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { parseCsv, mapColumns, type ColumnMapping, type ImportResult } from "@/lib/import/csv-parser";
import { normalizePhone } from "@/lib/compliance/sms";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../../demo-data";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface EstimateRow {
  customer_phone: string;
  service: string;
  description: string;
  amount: string;
  notes: string;
  status: string;
}

const COLUMN_MAPPINGS: ColumnMapping<EstimateRow>[] = [
  {
    field: "customer_phone",
    aliases: ["customer_phone", "phone", "phone_number", "cell", "mobile", "client_phone", "telefono"],
    required: true,
  },
  {
    field: "service",
    aliases: ["service", "service_type", "type", "job_type", "work_type", "servicio"],
    required: true,
  },
  {
    field: "description",
    aliases: ["description", "desc", "details", "scope", "descripcion"],
  },
  {
    field: "amount",
    aliases: ["amount", "price", "total", "cost", "estimate_amount", "value", "monto", "precio"],
  },
  {
    field: "notes",
    aliases: ["notes", "note", "comments", "comment", "notas"],
  },
  {
    field: "status",
    aliases: ["status", "estado"],
  },
];

const VALID_STATUSES = new Set(["new", "sent", "follow_up", "won", "lost", "expired"]);

/**
 * Parse amount strings: strips $, commas, parses as float.
 */
function parseAmount(val: string): number | null {
  const cleaned = val.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) || num < 0 ? null : num;
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ imported: 3, skipped: 0, errors: [] });
  }

  const rl = await rateLimit(`import:estimates:${businessId}`, { limit: 5, windowSeconds: 3600 });
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

    // Pre-load existing customers
    const existingCustomers = await db
      .select({ id: customers.id, phone: customers.phone })
      .from(customers)
      .where(eq(customers.businessId, businessId));

    const customerByPhone = new Map<string, string>();
    for (const c of existingCustomers) {
      customerByPhone.set(normalizePhone(c.phone), c.id);
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

      // Match customer by phone
      const customerId = customerByPhone.get(normalizedPhone);
      if (!customerId) {
        result.errors.push({
          row: rowNum,
          reason: `No customer found with phone ${normalizedPhone.slice(-4).padStart(normalizedPhone.length, "*")}. Import customers first.`,
        });
        result.skipped++;
        continue;
      }

      const status = data.status && VALID_STATUSES.has(data.status.toLowerCase())
        ? data.status.toLowerCase()
        : "new";

      const amount = data.amount ? parseAmount(data.amount) : null;

      const followUpAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      try {
        await db.insert(estimates).values({
          businessId,
          customerId,
          service: data.service!,
          description: data.description || null,
          amount,
          notes: data.notes || null,
          status,
          nextFollowUpAt: followUpAt,
        });

        // Increment totalEstimates on customer
        await db.update(customers).set({
          totalEstimates: sql`${customers.totalEstimates} + 1`,
          updatedAt: new Date().toISOString(),
        }).where(eq(customers.id, customerId));

        result.imported++;
      } catch (err) {
        reportError("Failed to import estimate row", err, { businessId });
        result.errors.push({ row: rowNum, reason: "Database error" });
      }
    }

    await logActivity({
      type: "csv_import",
      entityType: "estimate",
      title: `Imported ${result.imported} estimates from CSV`,
      detail: `${result.skipped} skipped (no matching customer), ${result.errors.length} errors, ${rows.length} total rows`,
      metadata: { businessId },
    });

    return NextResponse.json(result);
  } catch (error) {
    reportError("Estimate CSV import failed", error, { businessId });
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
