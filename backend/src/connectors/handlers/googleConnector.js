const nowIso = () => new Date().toISOString();

const isConfigured = () => {
  // Placeholder for future OAuth + provider credentials.
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
};

const getStatus = ({ userId } = {}) => {
  if (!userId) return { status: "disconnected", updatedAt: null };
  return {
    status: isConfigured() ? "disconnected" : "disconnected",
    updatedAt: null,
  };
};

const connect = async ({ userId } = {}) => {
  if (!userId) return { ok: false, message: "Missing user" };
  if (!isConfigured()) {
    return {
      ok: false,
      message:
        "Google connector is not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).",
    };
  }

  // OAuth flow not implemented yet.
  return { ok: false, message: "Google connector not implemented" };
};

const sync = async ({ userId } = {}) => {
  if (!userId) return { ok: false, message: "Missing user" };
  if (!isConfigured()) {
    return {
      ok: false,
      message:
        "Google connector is not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).",
    };
  }

  return {
    ok: false,
    message: "Google sync not implemented",
    syncedAt: nowIso(),
  };
};

export default {
  id: "google",
  getStatus,
  connect,
  sync,
};
