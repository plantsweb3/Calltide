import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchPlaces } from "@/lib/scraper/google-places";
import { enrichProspect } from "@/lib/scraper/enrichment";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { logProspectScraped } from "@/lib/activity";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const scrapeSchema = z.object({
  city: z.string().min(1).max(100),
  state: z.string().max(50).optional(),
  vertical: z.string().min(1).max(100),
  maxResults: z.number().int().min(1).max(200).default(60),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`scrape:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = scrapeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }
  const { city, state, vertical, maxResults } = parsed.data;

  const query = `${vertical} in ${city}${state ? `, ${state}` : ""}`;

  try {
    const places = await searchPlaces(query, maxResults);
    let inserted = 0;
    let skipped = 0;

    for (const place of places) {
      const enrichment = enrichProspect(place);

      try {
        const [row] = await db
          .insert(prospects)
          .values({
            placeId: place.placeId,
            businessName: place.businessName,
            phone: place.phone,
            website: place.website,
            address: place.address,
            city: place.city ?? city,
            state: place.state ?? state,
            vertical,
            rating: place.rating,
            reviewCount: place.reviewCount,
            language: enrichment.language,
            size: enrichment.size,
            leadScore: enrichment.leadScore,
            source: "google_places",
          })
          .onConflictDoNothing({ target: prospects.placeId })
          .returning();

        if (row) {
          inserted++;
          await logProspectScraped(row.id, row.businessName, city);
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      total: places.length,
      inserted,
      skipped,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Scrape failed" },
      { status: 500 },
    );
  }
}
