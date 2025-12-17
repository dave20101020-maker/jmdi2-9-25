// src/utils/apiClient.js

let auth0ClientPromise;

const normalizeAuth0Domain = (domain) => {
  if (!domain) return "";
  return String(domain)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "");
};

const getAuth0Client = async () => {
  if (typeof window === "undefined") return null;

  const enableAuth0 = import.meta.env.VITE_ENABLE_AUTH0 === "true";
  if (!enableAuth0) return null;

  const domain = normalizeAuth0Domain(import.meta.env.VITE_AUTH0_DOMAIN);
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  if (!domain || !clientId) return null;

  if (!auth0ClientPromise) {
    auth0ClientPromise = import("@auth0/auth0-spa-js").then(
      ({ createAuth0Client }) =>
        createAuth0Client({
          domain,
          clientId,
          authorizationParams: {
            redirect_uri: window.location.origin,
            audience,
          },
        })
    );
  }

  return auth0ClientPromise;
};

const getAuth0AccessTokenIfAuthenticated = async () => {
  try {
    const client = await getAuth0Client();
    if (!client) return null;

    const authenticated = await client.isAuthenticated().catch(() => false);
    if (!authenticated) return null;

    return await client.getTokenSilently();
  } catch {
    return null;
  }
};

const normalizeOriginBase = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  // Allow legacy values like "/api" or "https://host/.../api".
  if (trimmed === "/api") return "";
  if (trimmed.endsWith("/api")) return trimmed.slice(0, -"/api".length);

  return trimmed;
};

const isStaleCodespacesOrigin = (originBase) => {
  if (typeof window === "undefined") return false;
  try {
    const currentHost = window.location?.hostname || "";
    if (!currentHost.endsWith(".app.github.dev")) return false;

    const url = new URL(originBase);
    const targetHost = url.hostname || "";
    if (!targetHost.endsWith(".app.github.dev")) return false;

    const slugFromHost = (host) => {
      const match = host.match(/^(.*)-\d+\.app\.github\.dev$/);
      return match ? match[1] : null;
    };

    const currentSlug = slugFromHost(currentHost);
    const targetSlug = slugFromHost(targetHost);
    return Boolean(currentSlug && targetSlug && currentSlug !== targetSlug);
  } catch {
    return false;
  }
};

const envOriginBase = normalizeOriginBase(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    ""
);

// If a stale Codespaces origin is baked into env, ignore it and rely on `/api` proxy.
const DEFAULT_ORIGIN_BASE =
  envOriginBase && isStaleCodespacesOrigin(envOriginBase) ? "" : envOriginBase;

const API_PREFIX = "/api";

const normalizePath = (path = "/") => {
  if (path.startsWith("http")) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const normalizeApiPath = (path = "/") => {
  const normalized = normalizePath(path);
  if (normalized === API_PREFIX) return "/";
  if (normalized.startsWith(`${API_PREFIX}/`)) {
    return normalized.slice(API_PREFIX.length) || "/";
  }
  return normalized;
};

const isAuthApiPath = (path = "/") => {
  const apiPath = normalizeApiPath(path);
  return apiPath === "/auth" || apiPath.startsWith("/auth/");
};

export class APIClient {
  constructor(baseUrl = DEFAULT_ORIGIN_BASE) {
    this.baseUrl = normalizeOriginBase(baseUrl);
  }

  buildUrl(path) {
    const apiPath = normalizeApiPath(path);
    if (!this.baseUrl) {
      return `${API_PREFIX}${apiPath}`;
    }
    return `${this.baseUrl}${API_PREFIX}${apiPath}`;
  }

  async refreshSession() {
    const res = await fetch(this.buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }
      const message =
        parsed?.message || parsed?.error || text || "Unable to refresh session";
      const error = new Error(message);
      error.status = res.status;
      error.body = parsed || text;
      throw error;
    }

    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  emit(eventName, detail) {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch (_) {
      // noop when window is unavailable
    }
  }

  async request(path, options = {}) {
    const {
      method = "GET",
      body,
      headers = {},
      retryOnUnauthorized = true,
    } = options;

    const url = this.buildUrl(path);
    const shouldLogAuth = isAuthApiPath(path);
    if (shouldLogAuth) {
      console.info("[AUTH] API request", {
        method,
        path: normalizeApiPath(path),
      });
    }
    const init = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      credentials: "include",
    };

    if (!isAuthApiPath(path)) {
      const existingAuthorization =
        init.headers.Authorization || init.headers.authorization;
      if (!existingAuthorization) {
        const token = await getAuth0AccessTokenIfAuthenticated();
        if (token) {
          init.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    if (body !== undefined) {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      if (method === "GET") return [];
      return { ok: false, error: "connection" };
    }

    if (shouldLogAuth) {
      console.info("[AUTH] API response", {
        method,
        path: normalizeApiPath(path),
        status: res.status,
      });
    }

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (res.status === 401 && retryOnUnauthorized) {
      try {
        if (shouldLogAuth) {
          console.info("[AUTH] API 401 -> refresh", {
            path: normalizeApiPath(path),
          });
        }
        await this.refreshSession();
        if (shouldLogAuth) {
          console.info("[AUTH] refresh ok -> retry", {
            path: normalizeApiPath(path),
          });
        }
        return this.request(path, {
          method,
          body,
          headers,
          retryOnUnauthorized: false,
        });
      } catch (refreshError) {
        if (shouldLogAuth) {
          console.info("[AUTH] refresh failed", {
            path: normalizeApiPath(path),
            message: refreshError?.message,
          });
        }
        this.emit("api-error", { status: 401, error: refreshError });
        this.emit("auth-required", { reason: "refresh-failed" });
        const error = new Error(
          refreshError?.message || data?.message || "Unauthorized"
        );
        error.status = 401;
        throw error;
      }
    }

    if (!res.ok) {
      this.emit("api-error", { status: res.status, body: data });
      const error = new Error(data?.message || text || "Request failed");
      error.status = res.status;
      throw error;
    }

    return data;
  }

  get(path) {
    return this.request(path, { method: "GET" });
  }

  post(path, body) {
    return this.request(path, { method: "POST", body });
  }

  put(path, body) {
    return this.request(path, { method: "PUT", body });
  }

  delete(path) {
    return this.request(path, { method: "DELETE" });
  }

  login(email, password) {
    return this.post("/auth/login", { emailOrUsername: email, password });
  }

  logout() {
    return this.post("/auth/logout");
  }

  register(email, password, name) {
    return this.post("/auth/register", { email, password, name });
  }

  me() {
    return this.get("/auth/me").then((payload) => {
      if (payload && typeof payload === "object") {
        return payload.data ?? payload.user ?? payload;
      }
      return payload;
    });
  }

  authMe() {
    return this.me();
  }
}

const toKebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(
      /^get|^create|^update|^delete|^log|^list|^post|^put|^patch|^ai/,
      ""
    )
    .replace(/^-+/, "")
    .toLowerCase();

const client = new APIClient();

const baseApi = {
  request: client.request.bind(client),
  get: client.get.bind(client),
  post: client.post.bind(client),
  put: client.put.bind(client),
  delete: client.delete.bind(client),
  login: client.login.bind(client),
  logout: client.logout.bind(client),
  register: client.register.bind(client),
  me: client.me.bind(client),
  authMe: client.authMe.bind(client),
};

const dynamic = new Proxy(baseApi, {
  get(target, prop) {
    if (prop in target) return target[prop];

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
        return client.post("/ai/coach", payload);
      };
    }

    if (prop === "authUpdateMe") {
      return (data) => client.put("/auth/me", data);
    }

    if (prop === "getPillarContent") {
      return () => client.get("/content");
    }

    if (prop === "getNotifications") {
      return () => client.get("/notifications");
    }

    if (prop === "ai") {
      return (path, body) => client.post(`/ai/${path}`, body);
    }

    if (prop === "sendMessage") {
      return (body) => client.post("/messages", body);
    }

    if (prop === "getConversation") {
      return (id) => client.get(`/messages/${id}`);
    }

    if (prop === "listFriends") {
      return () => client.get("/friends");
    }

    const name = String(prop);
    const lower = name.toLowerCase();
    let method = "GET";
    if (
      lower.startsWith("create") ||
      lower.startsWith("log") ||
      lower.startsWith("post")
    ) {
      method = "POST";
    } else if (
      lower.startsWith("update") ||
      lower.startsWith("put") ||
      lower.startsWith("patch")
    ) {
      method = "PUT";
    } else if (lower.startsWith("delete") || lower.startsWith("remove")) {
      method = "DELETE";
    }
    const path = "/" + toKebab(name).replace(/_/g, "-");
    return (bodyOrParams) =>
      client.request(path, {
        method,
        body: method === "GET" ? undefined : bodyOrParams,
      });
  },
});

export const api = dynamic;
export const apiClient = client;

export default api;
