import { getAccessToken } from "./GoogleIdentity.js";
import { put } from "../../vault/VaultService.js";
import { VAULT_RECORD_TYPES } from "../../vault/VaultTypes.js";

const MAX_EVENTS = 250;
const DAYS_BACK = 90;

const buildTimeWindow = () => {
  const now = new Date();
  const timeMax = now.toISOString();
  const timeMin = new Date(
    now.getTime() - DAYS_BACK * 24 * 60 * 60 * 1000
  ).toISOString();
  return { timeMin, timeMax };
};

export async function syncCalendar({ userId }) {
  const token = await getAccessToken(userId);
  if (!token) {
    return { ok: false, message: "Google Calendar not connected" };
  }

  const { timeMin, timeMax } = buildTimeWindow();
  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("maxResults", String(MAX_EVENTS));
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set(
    "fields",
    "items(id,summary,description,location,creator,organizer,start,end,updated,status)"
  );

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return { ok: false, message: "Calendar sync failed" };
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  let storedCount = 0;
  for (const event of items) {
    const payload = {
      source: "google_calendar",
      eventId: event.id,
      summary: event.summary || null,
      description: event.description || null,
      location: event.location || null,
      organizer: event.organizer?.email || null,
      creator: event.creator?.email || null,
      status: event.status || null,
      start: event.start || null,
      end: event.end || null,
      updated: event.updated || null,
    };

    await put(VAULT_RECORD_TYPES.CALENDAR_EVENT, payload, {
      userId,
      timestamp: event.updated || new Date().toISOString(),
    });
    storedCount += 1;
  }

  return { ok: true, count: storedCount };
}

export default {
  syncCalendar,
};
