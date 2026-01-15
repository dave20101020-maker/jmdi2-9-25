import { getAccessToken } from "./GoogleIdentity.js";
import { put } from "../../vault/VaultService.js";
import { VAULT_RECORD_TYPES } from "../../vault/VaultTypes.js";

const MAX_FILES = 50;

export async function syncDrive({ userId }) {
  const token = await getAccessToken(userId);
  if (!token) {
    return { ok: false, message: "Drive not connected" };
  }

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", String(MAX_FILES));
  url.searchParams.set(
    "fields",
    "files(id,name,mimeType,modifiedTime,createdTime,owners,iconLink,webViewLink,size)"
  );

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    return { ok: false, message: "Drive sync failed" };
  }

  const data = await response.json();
  const files = Array.isArray(data.files) ? data.files : [];

  let storedCount = 0;
  for (const file of files) {
    const payload = {
      source: "google_drive",
      fileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size || null,
      modifiedTime: file.modifiedTime || null,
      createdTime: file.createdTime || null,
      owners: (file.owners || []).map((owner) => owner.emailAddress),
      iconLink: file.iconLink || null,
      webViewLink: file.webViewLink || null,
    };

    await put(VAULT_RECORD_TYPES.DRIVE_FILE, payload, {
      userId,
      timestamp: file.modifiedTime || new Date().toISOString(),
    });
    storedCount += 1;
  }

  return { ok: true, count: storedCount };
}

export default {
  syncDrive,
};
