import PrimaryVaultStore from "./stores/PrimaryVaultStore.js";
import { isValidVaultRecordType } from "./VaultTypes.js";
import { appendVaultEvent } from "./events/VaultEventLog.js";

const primaryStore = new PrimaryVaultStore();

export async function put(type, payload = {}, metadata = {}, options = {}) {
  if (!isValidVaultRecordType(type)) {
    throw new Error(`Unsupported vault record type: ${type}`);
  }

  const result = await primaryStore.put({
    userId: metadata.userId,
    type,
    payload,
    metadata,
  });

  if (!result.ok && options.required !== false) {
    throw new Error(result.reason || "vault_unavailable");
  }

  return result;
}

export async function query(type, filters = {}, metadata = {}) {
  if (!isValidVaultRecordType(type)) {
    throw new Error(`Unsupported vault record type: ${type}`);
  }

  return primaryStore.query({
    userId: metadata.userId,
    type,
    filters,
  });
}

export async function appendEvent(eventType, payload = {}, metadata = {}) {
  await appendVaultEvent({ eventType, payload, metadata });
}

export default {
  put,
  query,
  appendEvent,
};
