import { db } from "@/db";
import { weatherCache } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
  state?: string;
}

interface WeatherData {
  temperature: number; // °F
  feelsLike: number;
  humidity: number;
  windSpeed: number; // mph
  weatherCode: number;
  description: string;
  isDay: boolean;
  // Forecast
  highToday: number;
  lowToday: number;
  precipitationChance: number;
  // Tomorrow
  highTomorrow: number;
  lowTomorrow: number;
  precipChanceTomorrow: number;
  weatherCodeTomorrow: number;
}

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

/**
 * Geocode a city/state to lat/lon using Open-Meteo's geocoding API.
 */
async function geocode(query: string): Promise<GeoLocation | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const r = data.results[0];
    return {
      lat: r.latitude,
      lon: r.longitude,
      name: r.name,
      state: r.admin1,
    };
  } catch (err) {
    reportError("Geocoding failed", err);
    return null;
  }
}

/**
 * Fetch weather from Open-Meteo API (free, no API key needed).
 */
async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lon.toString());
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("forecast_days", "2");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();

    const current = data.current;
    const daily = data.daily;

    return {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
      description: WMO_CODES[current.weather_code] || "Unknown",
      isDay: current.is_day === 1,
      highToday: Math.round(daily.temperature_2m_max[0]),
      lowToday: Math.round(daily.temperature_2m_min[0]),
      precipitationChance: daily.precipitation_probability_max[0] ?? 0,
      highTomorrow: Math.round(daily.temperature_2m_max[1]),
      lowTomorrow: Math.round(daily.temperature_2m_min[1]),
      precipChanceTomorrow: daily.precipitation_probability_max[1] ?? 0,
      weatherCodeTomorrow: daily.weather_code[1] ?? 0,
    };
  } catch (err) {
    reportError("Weather fetch failed", err);
    return null;
  }
}

/**
 * Get trade-specific weather advisory based on conditions.
 */
function getTradeAdvisory(weather: WeatherData, tradeType: string): string | null {
  const advisories: string[] = [];

  // Extreme heat
  if (weather.highToday >= 100) {
    const heatTrades = ["hvac", "roofing", "landscaping", "general_contracting", "restoration"];
    if (heatTrades.includes(tradeType)) {
      advisories.push(`Extreme heat (${weather.highToday}°F) — expect higher call volume for AC emergencies and outdoor crew scheduling challenges.`);
    }
  } else if (weather.highToday >= 95) {
    if (tradeType === "hvac") {
      advisories.push(`Hot day ahead (${weather.highToday}°F) — AC service calls likely to spike.`);
    }
  }

  // Freezing temps
  if (weather.lowToday <= 32) {
    if (tradeType === "plumbing") {
      advisories.push(`Freezing temps tonight (${weather.lowToday}°F) — burst pipe calls possible tomorrow morning.`);
    }
    if (tradeType === "hvac") {
      advisories.push(`Freezing temps (${weather.lowToday}°F) — heating emergency calls expected.`);
    }
    if (tradeType === "landscaping") {
      advisories.push(`Freeze warning (${weather.lowToday}°F) — outdoor work may need to be rescheduled.`);
    }
  }

  // Rain/storms
  if (weather.precipitationChance >= 70) {
    if (tradeType === "roofing") {
      advisories.push(`${weather.precipitationChance}% rain chance today — roof work may need rescheduling. Expect leak repair calls after the rain.`);
    }
    if (["landscaping", "general_contracting"].includes(tradeType)) {
      advisories.push(`Rain likely today (${weather.precipitationChance}%) — outdoor jobs may need rescheduling.`);
    }
    if (tradeType === "restoration") {
      advisories.push(`Heavy rain expected (${weather.precipitationChance}%) — water damage calls may increase.`);
    }
  }

  // Thunderstorms
  if (weather.weatherCode >= 95) {
    if (tradeType === "electrical") {
      advisories.push("Thunderstorms in the area — expect power surge and electrical damage calls.");
    }
    if (tradeType === "roofing") {
      advisories.push("Storm activity — prepare for emergency tarping and storm damage assessment calls.");
    }
    if (tradeType === "restoration") {
      advisories.push("Severe weather — water/wind damage calls likely incoming.");
    }
  }

  // High winds
  if (weather.windSpeed >= 25) {
    if (tradeType === "roofing") {
      advisories.push(`High winds (${weather.windSpeed} mph) — shingle damage calls possible.`);
    }
  }

  return advisories.length > 0 ? advisories.join(" ") : null;
}

/**
 * Get weather for a location with caching.
 * Cache TTL: 2 hours.
 */
export async function getWeather(
  locationQuery: string,
  tradeType: string
): Promise<{
  weather: WeatherData;
  location: string;
  advisory: string | null;
} | null> {
  const locationKey = locationQuery.toLowerCase().trim();

  // Check cache
  const [cached] = await db
    .select()
    .from(weatherCache)
    .where(eq(weatherCache.locationKey, locationKey))
    .limit(1);

  if (cached && new Date(cached.expiresAt) > new Date()) {
    const weather = cached.data as unknown as WeatherData;
    return {
      weather,
      location: locationQuery,
      advisory: getTradeAdvisory(weather, tradeType),
    };
  }

  // Geocode
  const geo = await geocode(locationQuery);
  if (!geo) return null;

  // Fetch weather
  const weather = await fetchWeather(geo.lat, geo.lon);
  if (!weather) return null;

  // Cache for 2 hours
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  try {
    // Upsert cache
    if (cached) {
      await db.update(weatherCache).set({
        data: weather as unknown as Record<string, unknown>,
        expiresAt,
        lat: geo.lat,
        lon: geo.lon,
      }).where(eq(weatherCache.id, cached.id));
    } else {
      await db.insert(weatherCache).values({
        locationKey,
        lat: geo.lat,
        lon: geo.lon,
        data: weather as unknown as Record<string, unknown>,
        expiresAt,
      });
    }
  } catch {
    // Cache write failure is non-critical
  }

  return {
    weather,
    location: `${geo.name}${geo.state ? `, ${geo.state}` : ""}`,
    advisory: getTradeAdvisory(weather, tradeType),
  };
}

/**
 * Clean up expired weather cache entries.
 */
export async function cleanExpiredWeatherCache(): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.delete(weatherCache).where(lt(weatherCache.expiresAt, now));
  return result.rowsAffected;
}
