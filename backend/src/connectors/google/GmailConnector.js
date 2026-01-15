import { getAccessToken } from "./GoogleIdentity.js";
import { put } from "../../vault/VaultService.js";
import { VAULT_RECORD_TYPES } from "../../vault/VaultTypes.js";

const MAX_MESSAGES = 50;

const extractHeader = (headers = [], name) => {
  const match = headers.find((header) => header.name?.toLowerCase() === name);
  return match?.value || null;
};

export async function syncGmail({ userId }) {
  const token = await getAccessToken(userId);
  if (!token) {
    return { ok: false, message: "Gmail not connected" };
  }

  const listUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages"
  );
  listUrl.searchParams.set("maxResults", String(MAX_MESSAGES));
  listUrl.searchParams.set("q", "newer_than:90d");

  const listResponse = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listResponse.ok) {
    return { ok: false, message: "Gmail list failed" };
  }

  const listData = await listResponse.json();
  const messages = Array.isArray(listData.messages) ? listData.messages : [];

  let storedCount = 0;
  for (const message of messages) {
    const messageUrl = new URL(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`
    );
    messageUrl.searchParams.set("format", "metadata");
    messageUrl.searchParams.set("metadataHeaders", "From");
    messageUrl.searchParams.set("metadataHeaders", "To");
    messageUrl.searchParams.set("metadataHeaders", "Subject");
    messageUrl.searchParams.set("metadataHeaders", "Date");

    const messageResponse = await fetch(messageUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!messageResponse.ok) {
      continue;
    }

    const detail = await messageResponse.json();
    const headers = detail.payload?.headers || [];
    const payload = {
      source: "gmail",
      messageId: detail.id,
      threadId: detail.threadId,
      labelIds: detail.labelIds || [],
      snippet: detail.snippet || null,
      from: extractHeader(headers, "from"),
      to: extractHeader(headers, "to"),
      subject: extractHeader(headers, "subject"),
      date: extractHeader(headers, "date"),
    };

    await put(VAULT_RECORD_TYPES.EMAIL_HEADER, payload, {
      userId,
      timestamp: new Date().toISOString(),
    });
    storedCount += 1;
  }

  return { ok: true, count: storedCount };
}

export default {
  syncGmail,
};
