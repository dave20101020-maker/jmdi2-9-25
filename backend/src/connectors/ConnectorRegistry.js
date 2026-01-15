import {
  getAuthUrl,
  exchangeCode,
  storeTokens,
  getStatus as getGoogleStatus,
} from "./google/GoogleIdentity.js";
import { syncCalendar } from "./google/CalendarConnector.js";
import { syncGmail } from "./google/GmailConnector.js";
import { syncDrive } from "./google/DriveConnector.js";
import { appendEvent } from "../vault/VaultService.js";
import { VAULT_RECORD_TYPES } from "../vault/VaultTypes.js";
import {
  connectApple,
  syncApple,
  getAppleStatus,
} from "./apple/AppleConnector.js";
import {
  connectSamsung,
  syncSamsung,
  getSamsungStatus,
} from "./samsung/SamsungConnector.js";

export const ConnectorRegistry = {
  google: {
    id: "google",
    name: "Google",
    async connect({ userId, payload = {} }) {
      if (payload.code) {
        const tokens = await exchangeCode(payload.code);
        storeTokens(userId, tokens);
        return { ok: true, status: "connected" };
      }
      if (payload.accessToken || payload.refreshToken) {
        storeTokens(userId, {
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken,
        });
        return { ok: true, status: "connected" };
      }
      return { ok: true, status: "disconnected", authUrl: getAuthUrl() };
    },
    async sync({ userId }) {
      const calendar = await syncCalendar({ userId });
      const gmail = await syncGmail({ userId });
      const drive = await syncDrive({ userId });

      await appendEvent(
        "connector.google.calendar.sync",
        { ok: calendar.ok, count: calendar.count || 0 },
        { userId, type: VAULT_RECORD_TYPES.CALENDAR_EVENT }
      );
      await appendEvent(
        "connector.google.gmail.sync",
        { ok: gmail.ok, count: gmail.count || 0 },
        { userId, type: VAULT_RECORD_TYPES.EMAIL_HEADER }
      );
      await appendEvent(
        "connector.google.drive.sync",
        { ok: drive.ok, count: drive.count || 0 },
        { userId, type: VAULT_RECORD_TYPES.DRIVE_FILE }
      );

      return {
        ok: calendar.ok && gmail.ok && drive.ok,
        status: "connected",
        results: { calendar, gmail, drive },
      };
    },
    getStatus({ userId }) {
      const status = getGoogleStatus(userId);
      return {
        ok: true,
        status: status.connected ? "connected" : "disconnected",
        updatedAt: status.updatedAt || null,
      };
    },
  },
  apple: {
    id: "apple",
    name: "Apple",
    async connect() {
      return connectApple();
    },
    async sync() {
      return syncApple();
    },
    getStatus() {
      return getAppleStatus();
    },
  },
  samsung: {
    id: "samsung",
    name: "Samsung",
    async connect() {
      return connectSamsung();
    },
    async sync() {
      return syncSamsung();
    },
    getStatus() {
      return getSamsungStatus();
    },
  },
};

export const listConnectors = () =>
  Object.values(ConnectorRegistry).map((connector) => ({
    id: connector.id,
    name: connector.name,
  }));

export const getConnector = (id) => ConnectorRegistry[id];

export default ConnectorRegistry;
