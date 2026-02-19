import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { enrichProspect } from "@/lib/scraper/enrichment";
import { logActivity } from "@/lib/activity";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have headers + at least 1 row" }, { status: 400 });
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  let inserted = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });

    const businessName = row.business_name || row.name || row.company;
    if (!businessName) {
      errors++;
      continue;
    }

    const place = {
      placeId: "",
      businessName,
      phone: row.phone || row.telephone,
      website: row.website || row.url,
      address: row.address,
      city: row.city,
      state: row.state,
      rating: row.rating ? parseFloat(row.rating) : undefined,
      reviewCount: row.review_count ? parseInt(row.review_count, 10) : undefined,
    };

    const enrichment = enrichProspect(place);

    try {
      const [created] = await db
        .insert(prospects)
        .values({
          businessName,
          phone: place.phone || null,
          email: row.email || null,
          website: place.website || null,
          address: place.address || null,
          city: place.city || null,
          state: place.state || null,
          vertical: row.vertical || row.category || null,
          rating: place.rating,
          reviewCount: place.reviewCount,
          language: enrichment.language,
          size: enrichment.size,
          leadScore: enrichment.leadScore,
          source: "csv_import",
        })
        .returning();

      if (created) inserted++;
    } catch {
      errors++;
    }
  }

  await logActivity({
    type: "csv_import",
    title: `CSV import: ${inserted} prospects`,
    detail: `${errors} errors, ${lines.length - 1} total rows`,
  });

  return NextResponse.json({
    success: true,
    inserted,
    errors,
    totalRows: lines.length - 1,
  });
}
