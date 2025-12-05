const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

if (!BASE_URL) {
  console.error("[apiClient] VITE_BACKEND_URL missing");
}

class APIClient {
  async request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    let response;

    try {
      response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        credentials: "include",
        ...options,
      });
    } catch (networkError) {
      console.error("[apiClient] Network failure", {
        path,
        url,
        message: networkError?.message,
      });
      throw networkError;
    }

    const text = await response.text();
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        console.error("Bad response:", text);
        throw new Error("Response was not JSON");
      }
    }

    if (!response.ok) {
      const err = new Error(
        payload?.message || response.statusText || "Request failed"
      );
      err.status = response.status;
      err.body = payload;
      console.error("[apiClient] Request error", {
        path,
        url,
        status: response.status,
        body: payload,
      });
      throw err;
    }

    return payload;
  }

  authMe() {
    return this.request("/api/auth/me");
  }

  register(data) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  login(data) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  me() {
    return this.authMe();
  }

  getPillars(query = "") {
    const search = query ? `?${query}` : "";
    return this.request(`/api/pillars${search}`);
  }

  upsertPillar(data) {
    return this.request("/api/pillars", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getEntries(query = "") {
    const search = query ? `?${query}` : "";
    return this.request(`/api/entries${search}`);
  }

  createEntry(data) {
    return this.request("/api/entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  ai(path, data) {
    return this.request(`/api/ai/${path}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getOnboardingProfile() {
    return this.request("/api/onboarding");
  }

  saveOnboardingProfile(data) {
    return this.request("/api/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getMySubscription() {
    return this.request("/api/subscription/me");
  }

  upgradeSubscription(tier) {
    return this.request("/api/subscription/upgrade", {
      method: "POST",
      body: JSON.stringify({ tier }),
    });
  }

  createActionPlan(data) {
    return this.request("/api/action-plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getLatestActionPlan(pillarId) {
    return this.request(`/api/action-plans/${pillarId}`);
  }

  createPillarCheckIn(data) {
    return this.request("/api/pillars/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getPillarHistory(pillarId) {
    return this.request(`/api/pillars/${pillarId}/history`);
  }

  sendFriendRequest(data) {
    return this.request("/api/friends/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  acceptFriendRequest(data) {
    return this.request("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  listFriends() {
    return this.request("/api/friends");
  }

  listPendingFriendRequests() {
    return this.request("/api/friends/pending");
  }

  getLeaderboard(pillarId) {
    return this.request(`/api/friends/leaderboard/${pillarId}`);
  }

  getOverallLeaderboard() {
    return this.request("/api/friends/leaderboard/overall");
  }

  getWeeklyReport() {
    return this.request("/api/ai/weekly-report");
  }

  createChallenge(data) {
    return this.request("/api/challenges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  joinChallenge(challengeId) {
    return this.request("/api/challenges/join", {
      method: "POST",
      body: JSON.stringify({ challengeId }),
    });
  }

  getMyChallenges() {
    return this.request("/api/challenges/my");
  }

  sendMessage(data) {
    return this.request("/api/messages/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getConversation(friendId) {
    return this.request(`/api/messages/${friendId}`);
  }

  getNotifications() {
    return this.request("/api/notifications");
  }

  markNotificationsRead(body) {
    return this.request("/api/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getTimeline() {
    return this.request("/api/timeline");
  }

  exportUserData() {
    return this.request("/api/user/export");
  }

  deleteAccount() {
    return this.request("/api/user/delete-account", {
      method: "POST",
    });
  }
}

export const api = new APIClient();
export default api;
