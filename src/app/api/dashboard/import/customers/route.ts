import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { parseCsv, mapColumns, type ColumnMapping, type ImportResult } from "@/lib/import/csv-parser";
import { normalizePhone } from "@/lib/compliance/sms";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../../demo-data";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface CustomerRow {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  tags: string;
  language: string;
}

const COLUMN_MAPPINGS: ColumnMapping<CustomerRow>[] = [
  {
    field: "name",
    aliases: ["name", "customer_name", "full_name", "client_name", "first_name", "contact_name", "nombre"],
    required: true,
  },
  {
    field: "phone",
    aliases: ["phone", "phone_number", "cell", "mobile", "telephone", "tel", "cell_phone", "mobile_phone", "telefono"],
    required: true,
  },
  {
    field: "email",
    aliases: ["email", "email_address", "e-mail", "correo"],
  },
  {
    field: "address",
    aliases: ["address", "street_address", "full_address", "street", "location", "direccion"],
  },
  {
    field: "notes",
    aliases: ["notes", "note", "comments", "comment", "description", "notas"],
  },
  {
    field: "tags",
    aliases: ["tags", "tag", "labels", "categories", "category", "etiquetas"],
  },
  {
    field: "language",
    aliases: ["language", "lang", "idioma"],
  },
];

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ imported: 3, skipped: 0, errors: [] });
  }

  // Rate limit: 5 imports per hour per business
  const rl = await rateLimit(`import:customers:${businessId}`, { limit: 5, windowSeconds: 3600 });
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

    // Get existing phones for deduplication
    const existingCustomers = await db
      .select({ phone: customers.phone })
      .from(customers)
      .where(eq(customers.businessId, businessId));

    const existingPhones = new Set(existingCustomers.map((c) => normalizePhone(c.phone)));

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-indexed, skip header
      const { data, missing } = mapColumns(headers, rows[i], COLUMN_MAPPINGS);

      if (missing.length > 0) {
        result.errors.push({ row: rowNum, reason: `Missing required fields: ${missing.join(", ")}` });
        continue;
      }

      const normalizedPhone = normalizePhone(data.phone!);
      if (!normalizedPhone || normalizedPhone.length < 10) {
        result.errors.push({ row: rowNum, reason: "Invalid phone number" });
        continue;
      }

      // Dedup check
      if (existingPhones.has(normalizedPhone)) {
        result.skipped++;
        continue;
      }

      // Parse tags (semicolon or comma separated)
      const tags: string[] = data.tags
        ? data.tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean).slice(0, 10)
        : [];

      // Validate language
      const language = data.language?.toLowerCase() === "es" ? "es" : "en";

      try {
        await db.insert(customers).values({
          businessId,
          phone: normalizedPhone,
          name: data.name || null,
          email: data.email || null,
          address: data.address || null,
          notes: data.notes || null,
          tags,
          language,
          source: "csv_import",
          firstCallAt: new Date().toISOString(),
        });

        existingPhones.add(normalizedPhone); // prevent intra-batch dupes
        result.imported++;
      } catch (err) {
        reportError("Failed to import customer row", err, { businessId });
        result.errors.push({ row: rowNum, reason: "Database error" });
      }
    }

    await logActivity({
      type: "csv_import",
      entityType: "customer",
      title: `Imported ${result.imported} customers from CSV`,
      detail: `${result.skipped} skipped (duplicates), ${result.errors.length} errors, ${rows.length} total rows`,
      metadata: { businessId },
    });

    return NextResponse.json(result);
  } catch (error) {
    reportError("Customer CSV import failed", error, { businessId });
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
