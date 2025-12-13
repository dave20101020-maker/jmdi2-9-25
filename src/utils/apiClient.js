// src/utils/apiClient.js

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

async function request(method, path, body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, options);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed: ${res.status} - ${text}`);
    }

    try {
      return await res.json();
    } catch {
      return null;
    }
  } catch (err) {
    // Network or DNS error: return demo-safe defaults to prevent UI crashes
    if (method === "GET") return [];
    return { ok: false, error: "connection" };
  }
}

const baseApi = {
  get: (path) => request("GET", path),

  post: (path, body) => request("POST", path, body),

  put: (path, body) => request("PUT", path, body),

  delete: (path) => request("DELETE", path),

  // --------------------------
  // Auth Endpoints (demo-safe)
  // --------------------------
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),

  logout: () => request("POST", "/auth/logout"),

  register: (email, password, name) =>
    request("POST", "/auth/register", { email, password, name }),

  me: () => request("GET", "/auth/me"),

  // ⭐ Compatibility with old code ⭐
  authMe: () => request("GET", "/auth/me"),
};

const toKebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(
      /^get|^create|^update|^delete|^log|^list|^post|^put|^patch|^ai/,
      ""
    )
    .replace(/^-+/, "")
    .toLowerCase();

const dynamic = new Proxy(baseApi, {
  get(target, prop) {
    if (prop in target) return target[prop];
    // Special cases commonly used in app
    if (prop === "aiCoach") {
      return async (payload) => {
        const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
        if (DEMO) {
          return {
            greeting: "Here’s a quick insight",
            celebration: "Nice momentum!",
            focus_area: payload?.pillar || "General",
            top_insights: [],
            recommendations: [],
            suggested_plan: {
              title: "Starter Plan",
              description: "Try a simple daily habit.",
            },
          };
        }
        return request("POST", "/ai/coach", payload);
      };
    }
    if (prop === "authUpdateMe") {
      return (data) => request("PUT", "/auth/me", data);
    }
    if (prop === "getPillarContent") {
      return () => request("GET", "/content");
    }
    if (prop === "getNotifications") {
      return () => request("GET", "/notifications");
    }
    if (prop === "ai") {
      return (path, body) => request("POST", `/ai/${path}`, body);
    }
    if (prop === "sendMessage") {
      return (body) => request("POST", "/messages", body);
    }
    if (prop === "getConversation") {
      return (id) => request("GET", `/messages/${id}`);
    }
    if (prop === "listFriends") {
      return () => request("GET", "/friends");
    }
    // Generic inference by method prefix
    const name = String(prop);
    const lower = name.toLowerCase();
    let method = "GET";
    if (
      lower.startsWith("create") ||
      lower.startsWith("log") ||
      lower.startsWith("post")
    )
      method = "POST";
    else if (
      lower.startsWith("update") ||
      lower.startsWith("put") ||
      lower.startsWith("patch")
    )
      method = "PUT";
    else if (lower.startsWith("delete") || lower.startsWith("remove"))
      method = "DELETE";
    const path = "/" + toKebab(name).replace(/_/g, "-");
    return (bodyOrParams) =>
      request(method, path, method === "GET" ? undefined : bodyOrParams);
  },
});

export const api = dynamic;

export default api;
