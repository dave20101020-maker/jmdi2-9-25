const IS_DEV = import.meta.env.DEV;
const fallbackBackend = "http://localhost:5000";
const configuredBackend = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  fallbackBackend
).trim();
const normalizedBackend = configuredBackend.replace(/\/$/, "");
const sanitizedBackend = normalizedBackend.replace(/\/api$/i, "");
const API_BASE = sanitizedBackend || fallbackBackend;

const maskSensitive = (body) => {
  if (!body || typeof body !== "object") return body;
  const clone = { ...body };
  if (typeof clone.password !== "undefined") {
    clone.password = "***";
  }
  if (typeof clone.passphrase !== "undefined") {
    clone.passphrase = "***";
  }
  return clone;
};

const safeParse = (text) => {
  if (!text || !text.length) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const method = opts.method || "GET";
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const parsedBody =
    typeof opts.body === "string" ? safeParse(opts.body) : opts.body;
  const requestLog = maskSensitive(parsedBody);
  const shouldLog =
    IS_DEV && (path.startsWith("/api/auth/login") || opts.debug);

  if (shouldLog) {
    console.log(`[apiClient] ${method} ${url} request`, {
      body: requestLog,
    });
  }

  const res = await fetch(url, {
    credentials: "include", // send cookies
    headers,
    ...opts,
  });

  const text = await res.text().catch(() => null);
  const data = safeParse(text);

  if (shouldLog) {
    console.log(`[apiClient] ${method} ${url} response`, {
      status: res.status,
      json: data,
    });
  }

  if (!res.ok) {
    const errPayload = data || res.statusText;
    const message =
      errPayload && errPayload.message
        ? errPayload.message
        : typeof errPayload === "string"
        ? errPayload
        : JSON.stringify(errPayload);
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("api-error", { detail: message }));
      }
    } catch (e) {
      /* no-op */
    }
    const error =
      errPayload instanceof Error
        ? errPayload
        : { message, status: res.status, body: errPayload };
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (data) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/api/auth/me", { method: "GET" }),

  // Pillars
  getPillars: (q = "") => request(`/api/pillars${q ? `?${q}` : ""}`),
  upsertPillar: (data) =>
    request("/api/pillars", { method: "POST", body: JSON.stringify(data) }),

  // Entries
  getEntries: (q = "") => request(`/api/entries${q ? `?${q}` : ""}`),
  createEntry: (data) =>
    request("/api/entries", { method: "POST", body: JSON.stringify(data) }),

  // AI
  ai: (path, data) =>
    request(`/api/ai/${path}`, { method: "POST", body: JSON.stringify(data) }),
  // Onboarding
  getOnboardingProfile: () => request("/api/onboarding", { method: "GET" }),
  saveOnboardingProfile: (data) =>
    request("/api/onboarding", { method: "POST", body: JSON.stringify(data) }),
  // Subscription
  getMySubscription: () => request("/api/subscription/me", { method: "GET" }),
  upgradeSubscription: (tier) =>
    request("/api/subscription/upgrade", {
      method: "POST",
      body: JSON.stringify({ tier }),
    }),
  // Action Plans
  createActionPlan: (data) =>
    request("/api/action-plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLatestActionPlan: (pillarId) =>
    request(`/api/action-plans/${pillarId}`, { method: "GET" }),
  // Pillar check-ins
  createPillarCheckIn: (data) =>
    request("/api/pillars/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPillarHistory: (pillarId) =>
    request(`/api/pillars/${pillarId}/history`, { method: "GET" }),
  // Friends
  sendFriendRequest: (data) =>
    request("/api/friends/request", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  acceptFriendRequest: (data) =>
    request("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listFriends: () => request("/api/friends", { method: "GET" }),
  listPendingFriendRequests: () =>
    request("/api/friends/pending", { method: "GET" }),
  // Leaderboards
  getLeaderboard: (pillarId) =>
    request(`/api/friends/leaderboard/${pillarId}`, { method: "GET" }),
  getOverallLeaderboard: () =>
    request("/api/friends/leaderboard/overall", { method: "GET" }),
  // Weekly report
  getWeeklyReport: () => request("/api/ai/weekly-report", { method: "GET" }),
  // Challenges
  createChallenge: (data) =>
    request("/api/challenges", { method: "POST", body: JSON.stringify(data) }),
  joinChallenge: (challengeId) =>
    request("/api/challenges/join", {
      method: "POST",
      body: JSON.stringify({ challengeId }),
    }),
  getMyChallenges: () => request("/api/challenges/my", { method: "GET" }),
  // Messaging
  sendMessage: (data) =>
    request("/api/messages/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getConversation: (friendId) =>
    request(`/api/messages/${friendId}`, { method: "GET" }),
  // Notifications
  getNotifications: () => request("/api/notifications", { method: "GET" }),
  markNotificationsRead: (body) =>
    request("/api/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // Timeline
  getTimeline: () => request("/api/timeline", { method: "GET" }),
  // GDPR: export & delete
  exportUserData: () => request("/api/user/export", { method: "GET" }),
  deleteAccount: () => request("/api/user/delete-account", { method: "POST" }),
};

export default api;
