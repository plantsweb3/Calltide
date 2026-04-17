import { google } from "googleapis";
import { db } from "@/db";
import { googleCalendarConnections, appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error-reporting";
import { encryptToken, decryptToken } from "@/lib/crypto/token-encryption";

type CalendarConnection = typeof googleCalendarConnections.$inferSelect;

function getOAuth2Client() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
  );
}

async function refreshTokenIfNeeded(connection: CalendarConnection): Promise<string> {
  const expiresAt = new Date(connection.tokenExpiresAt).getTime();
  // Refresh 5 minutes before expiry
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return decryptToken(connection.accessToken);
  }

  const oauth2 = getOAuth2Client();
  if (!oauth2) throw new Error("Google OAuth not configured");

  oauth2.setCredentials({ refresh_token: decryptToken(connection.refreshToken) });
  const { credentials } = await oauth2.refreshAccessToken();

  const newAccessToken = credentials.access_token!;
  const newExpiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000).toISOString();

  await db
    .update(googleCalendarConnections)
    .set({
      accessToken: encryptToken(newAccessToken),
      tokenExpiresAt: newExpiresAt,
    })
    .where(eq(googleCalendarConnections.id, connection.id));

  return newAccessToken;
}

async function getConnection(businessId: string): Promise<CalendarConnection | null> {
  const [row] = await db
    .select()
    .from(googleCalendarConnections)
    .where(eq(googleCalendarConnections.businessId, businessId))
    .limit(1);
  return row ?? null;
}

export async function isGoogleCalendarConnected(businessId: string): Promise<boolean> {
  const conn = await getConnection(businessId);
  return conn !== null && conn.syncEnabled;
}

async function getAuthenticatedCalendar(businessId: string) {
  const conn = await getConnection(businessId);
  if (!conn || !conn.syncEnabled) return null;

  const oauth2 = getOAuth2Client();
  if (!oauth2) return null;

  try {
    const accessToken = await refreshTokenIfNeeded(conn);
    oauth2.setCredentials({ access_token: accessToken });
    return { calendar: google.calendar({ version: "v3", auth: oauth2 }), connection: conn };
  } catch (err) {
    reportError("Failed to get authenticated Google Calendar client", err, {
      businessId,
    });
    return null;
  }
}

export async function createCalendarEvent({
  businessId,
  summary,
  description,
  date,
  time,
  duration = 60,
  attendeeEmail,
  timezone = "America/Chicago",
}: {
  businessId: string;
  summary: string;
  description?: string;
  date: string;
  time: string;
  duration?: number;
  attendeeEmail?: string;
  timezone?: string;
}): Promise<string | null> {
  const auth = await getAuthenticatedCalendar(businessId);
  if (!auth) return null;

  try {
    const startDateTime = `${date}T${time}:00`;
    const endDate = new Date(`${startDateTime}`);
    endDate.setMinutes(endDate.getMinutes() + duration);
    const endDateTime = endDate.toISOString().slice(0, 19);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      summary,
      description,
      start: { dateTime: startDateTime, timeZone: timezone },
      end: { dateTime: endDateTime, timeZone: timezone },
    };

    if (attendeeEmail) {
      requestBody.attendees = [{ email: attendeeEmail }];
    }

    const res = await auth.calendar.events.insert({
      calendarId: auth.connection.calendarId,
      requestBody,
    });

    // Update last sync timestamp
    await db
      .update(googleCalendarConnections)
      .set({ lastSyncAt: new Date().toISOString() })
      .where(eq(googleCalendarConnections.id, auth.connection.id));

    return res.data.id ?? null;
  } catch (err) {
    reportError("Failed to create Google Calendar event", err, { businessId });
    return null;
  }
}

export async function updateCalendarEvent(
  businessId: string,
  eventId: string,
  updates: { summary?: string; description?: string; date?: string; time?: string; duration?: number; timezone?: string },
): Promise<boolean> {
  const auth = await getAuthenticatedCalendar(businessId);
  if (!auth) return false;

  try {
    const tz = updates.timezone || "America/Chicago";
    const requestBody: Record<string, unknown> = {};
    if (updates.summary) requestBody.summary = updates.summary;
    if (updates.description) requestBody.description = updates.description;

    if (updates.date && updates.time) {
      const startDateTime = `${updates.date}T${updates.time}:00`;
      const endDate = new Date(startDateTime);
      endDate.setMinutes(endDate.getMinutes() + (updates.duration || 60));
      requestBody.start = { dateTime: startDateTime, timeZone: tz };
      requestBody.end = { dateTime: endDate.toISOString().slice(0, 19), timeZone: tz };
    }

    await auth.calendar.events.patch({
      calendarId: auth.connection.calendarId,
      eventId,
      requestBody,
    });

    return true;
  } catch (err) {
    reportError("Failed to update Google Calendar event", err, { businessId });
    return false;
  }
}

export async function deleteCalendarEvent(
  businessId: string,
  eventId: string,
): Promise<boolean> {
  const auth = await getAuthenticatedCalendar(businessId);
  if (!auth) return false;

  try {
    await auth.calendar.events.delete({
      calendarId: auth.connection.calendarId,
      eventId,
    });
    return true;
  } catch (err) {
    reportError("Failed to delete Google Calendar event", err, { businessId });
    return false;
  }
}

// In-memory cache for FreeBusy results (5 min TTL)
const freeBusyCache = new Map<string, { data: Array<{ start: string; end: string }>; expiresAt: number }>();

export async function getFreeBusy(
  businessId: string,
  timeMin: string,
  timeMax: string,
): Promise<Array<{ start: string; end: string }>> {
  const cacheKey = `${businessId}:${timeMin}:${timeMax}`;
  const cached = freeBusyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const auth = await getAuthenticatedCalendar(businessId);
  if (!auth) return [];

  try {
    const res = await auth.calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: auth.connection.calendarId }],
      },
    });

    const busy = res.data.calendars?.[auth.connection.calendarId]?.busy ?? [];
    const result = busy
      .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
      .map((b) => ({ start: b.start!, end: b.end! }));

    // Cache for 5 minutes
    freeBusyCache.set(cacheKey, { data: result, expiresAt: Date.now() + 5 * 60 * 1000 });

    return result;
  } catch (err) {
    reportError("Failed to query Google Calendar FreeBusy", err, { businessId });
    return [];
  }
}

export async function storeEventId(appointmentId: string, eventId: string): Promise<void> {
  await db
    .update(appointments)
    .set({ googleCalendarEventId: eventId })
    .where(eq(appointments.id, appointmentId));
}
