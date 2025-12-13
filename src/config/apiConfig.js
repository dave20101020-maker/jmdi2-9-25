/**
 * Centralized API Configuration
 *
 * All API endpoints and base URLs are defined here for easy maintenance.
 * Import this file to get URLs instead of hardcoding them in components.
 */

const normalizeOriginBase = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim().replace(/\/+$/, "");
  if (!trimmed) return "";
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

// Base URL for all API calls (origin only). Endpoints below already include `/api/...`.
const envOriginBase = normalizeOriginBase(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    ""
);

export const API_BASE_URL =
  envOriginBase && isStaleCodespacesOrigin(envOriginBase) ? "" : envOriginBase;

/**
 * AI Service Endpoints
 */
export const AI_ENDPOINTS = {
  BASE: "/api/ai",

  // Orchestrator - main conversational AI
  ORCHESTRATOR: "/api/ai/orchestrator",

  // Specific AI endpoints
  COACH: "/api/ai/coach",
  DAILY_PLAN: "/api/ai/daily-plan",
  PILLAR_ANALYSIS: "/api/ai/pillar-analysis",
  WEEKLY_REFLECTION: "/api/ai/weekly-reflection",
  WEEKLY_REPORT: "/api/ai/weekly-report",

  // Crisis management
  CRISIS_CHECK: "/api/ai/crisis-check",
  SENTIMENT: "/api/ai/sentiment",
  TRANSCRIBE: "/api/ai/transcribe",

  // Item saving
  SAVE_PLAN: "/api/ai/items/plan",
  SAVE_GOAL: "/api/ai/items/goal",
  SAVE_HABIT: "/api/ai/items/habit",
  SAVE_ENTRY: "/api/ai/items/entry",

  // Memory management
  GET_MEMORY: "/api/ai/memory/:pillar",
  RESET_MEMORY: "/api/ai/memory/reset",
};

/**
 * Pillar CRUD Endpoints
 */
export const PILLAR_ENDPOINTS = {
  BASE: "/api/pillars",

  // Plans
  PLANS: "/api/plans",
  PLAN_BY_ID: "/api/plans/:id",

  // Goals
  GOALS: "/api/goals",
  GOAL_BY_ID: "/api/goals/:id",

  // Habits
  HABITS: "/api/habits",
  HABIT_BY_ID: "/api/habits/:id",

  // Check-ins
  CHECKINS: "/api/checkin",
  CHECKIN_BY_PILLAR: "/api/checkin/:pillar",

  // Screenings (assessments)
  SCREENINGS: "/api/screenings",
  SCREENING_BY_ID: "/api/screenings/:id",
};

/**
 * Authentication Endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  ME: "/api/auth/me",
  LOGOUT: "/api/auth/logout",
  REFRESH: "/api/auth/refresh",
};

/**
 * Other Endpoints
 */
export const OTHER_ENDPOINTS = {
  // Entries/journal
  ENTRIES: "/api/entries",
  ENTRY_BY_ID: "/api/entries/:id",

  // Meals & water tracking
  MEALS: "/api/meals",
  WATER: "/api/water",

  // Friends & leaderboard
  FRIENDS: "/api/friends",
  FRIEND_REQUESTS: "/api/friends/request",
  FRIEND_REQUESTS_PENDING: "/api/friends/pending",
  LEADERBOARD: "/api/friends/leaderboard",
  LEADERBOARD_BY_PILLAR: "/api/friends/leaderboard/:pillar",

  // Messages
  MESSAGES: "/api/messages",
  CONVERSATION: "/api/messages/:friendId",

  // Notifications
  NOTIFICATIONS: "/api/notifications",

  // Challenges
  CHALLENGES: "/api/challenges",
  MY_CHALLENGES: "/api/challenges/my",

  // Timeline
  TIMELINE: "/api/timeline",

  // Subscription
  SUBSCRIPTION: "/api/subscription",
  SUBSCRIPTION_ME: "/api/subscription/me",
  SUBSCRIPTION_UPGRADE: "/api/subscription/upgrade",

  // Action plans
  ACTION_PLANS: "/api/action-plans",
  ACTION_PLAN_BY_PILLAR: "/api/action-plans/:pillar",

  // User
  USER_EXPORT: "/api/user/export",
  USER_DELETE: "/api/user/delete-account",
};

/**
 * Helper function to replace path parameters
 * e.g., replacePathParams('/api/items/:id', { id: '123' }) => '/api/items/123'
 */
export const replacePathParams = (path, params = {}) => {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
};

/**
 * Build full URL from endpoint
 */
export const buildUrl = (endpoint, params = {}) => {
  const path = replacePathParams(endpoint, params);
  return `${API_BASE_URL}${path}`;
};

/**
 * Get authorization header with JWT token
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("jwt");
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
};

export default {
  API_BASE_URL,
  AI_ENDPOINTS,
  PILLAR_ENDPOINTS,
  AUTH_ENDPOINTS,
  OTHER_ENDPOINTS,
  replacePathParams,
  buildUrl,
  getAuthHeader,
};
