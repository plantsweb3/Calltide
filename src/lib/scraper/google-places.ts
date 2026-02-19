import { env } from "@/lib/env";

export interface PlaceResult {
  placeId: string;
  businessName: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewCount?: number;
}

interface AddressComponent {
  longText: string;
  types: string[];
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  rating?: number;
  userRatingCount?: number;
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

function extractCity(
  addressComponents?: AddressComponent[],
): string | undefined {
  return addressComponents?.find((c) => c.types.includes("locality"))
    ?.longText;
}

function extractState(
  addressComponents?: AddressComponent[],
): string | undefined {
  return addressComponents?.find((c) =>
    c.types.includes("administrative_area_level_1"),
  )?.longText;
}

export async function searchPlaces(
  query: string,
  maxResults: number = 60,
): Promise<PlaceResult[]> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const results: PlaceResult[] = [];
  const seenPlaceIds = new Set<string>();
  let pageToken: string | undefined;

  while (results.length < maxResults) {
    const body: Record<string, unknown> = {
      textQuery: query,
      pageSize: 20,
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.formattedAddress,places.addressComponents,places.rating,places.userRatingCount,nextPageToken",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Places API error ${res.status}: ${text}`);
    }

    const data: GooglePlacesResponse = await res.json();
    if (!data.places?.length) break;

    for (const place of data.places) {
      if (seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);

      results.push({
        placeId: place.id,
        businessName: place.displayName?.text ?? "Unknown",
        phone:
          place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? undefined,
        website: place.websiteUri,
        address: place.formattedAddress,
        city: extractCity(place.addressComponents),
        state: extractState(place.addressComponents),
        rating: place.rating,
        reviewCount: place.userRatingCount,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return results.slice(0, maxResults);
}
