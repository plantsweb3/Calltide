import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/scraper/google-places";
import { enrichProspect } from "@/lib/scraper/enrichment";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { logProspectScraped } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { city, state, vertical, maxResults = 60 } = body;

  if (!city || !vertical) {
    return NextResponse.json(
      { error: "city and vertical are required" },
      { status: 400 },
    );
  }

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
      { error: error instanceof Error ? error.message : "Scrape failed" },
      { status: 500 },
    );
  }
}
