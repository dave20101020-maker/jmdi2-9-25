/**
 * Lightweight Analytics Layer
 *
 * Simple event tracking and page view logging.
 * Ready for integration with real analytics provider (Mixpanel, Segment, etc.)
 *
 * TODO: Integrate real analytics provider
 * TODO: Add user identification and session tracking
 * TODO: Batch events for performance
 */

const isDev = import.meta.env.DEV;
const analyticsEndpoint =
  import.meta.env.VITE_ANALYTICS_ENDPOINT ||
  import.meta.env.REACT_APP_ANALYTICS_ENDPOINT ||
  null;

/**
 * Track a custom event
 * @param {string} name - Event name (e.g., 'habit_created', 'ai_interaction')
 * @param {object} props - Event properties
 */
export function trackEvent(name, props = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    type: "event",
    name,
    props,
  };

  // Log to console in development
  if (isDev) {
    console.log("[Analytics]", event);
  }

  // TODO: Send to real analytics provider
  // Example: mixpanel.track(name, props);
  // Example: segment.track(name, props);

  // Optional: Send to backend for custom analytics
  if (analyticsEndpoint) {
    fetch(analyticsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch((err) => {
      if (isDev) console.error("[Analytics] Failed to send event:", err);
    });
  }
}

/**
 * Track a page view
 * @param {string} path - Page path (e.g., '/dashboard', '/pillar/sleep')
 * @param {object} props - Additional properties (e.g., pillar name)
 */
export function trackPageView(path, props = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    type: "pageview",
    path,
    props,
  };

  if (isDev) {
    console.log("[Analytics]", event);
  }

  // TODO: Send to real provider
}

/**
 * Pre-defined event trackers for common actions
 */
export const analytics = {
  // Onboarding
  onboardingStarted: () => trackEvent("onboarding_started"),
  onboardingCompleted: () => trackEvent("onboarding_completed"),

  // Authentication
  signupStarted: () => trackEvent("signup_started"),
  signupCompleted: () => trackEvent("signup_completed"),
  loginCompleted: () => trackEvent("login_completed"),
  logoutCompleted: () => trackEvent("logout_completed"),

  // AI Interactions
  aiInteractionStarted: (pillar) =>
    trackEvent("ai_interaction_started", { pillar }),
  aiInteractionCompleted: (pillar, duration) =>
    trackEvent("ai_interaction_completed", { pillar, duration }),
  aiInteractionError: (pillar, error) =>
    trackEvent("ai_interaction_error", { pillar, error }),

  // Habits
  habitCreated: (pillar, name) => trackEvent("habit_created", { pillar, name }),
  habitCompleted: (habitId) => trackEvent("habit_completed", { habitId }),
  habitDeleted: (habitId) => trackEvent("habit_deleted", { habitId }),

  // Goals
  goalCreated: (pillar, name) => trackEvent("goal_created", { pillar, name }),
  goalCompleted: (goalId) => trackEvent("goal_completed", { goalId }),
  goalDeleted: (goalId) => trackEvent("goal_deleted", { goalId }),

  // Check-ins
  checkinCreated: (pillar, score) =>
    trackEvent("checkin_created", { pillar, score }),
  journalEntry: (pillar) => trackEvent("journal_entry", { pillar }),

  // Content
  contentGenerated: (type, pillar) =>
    trackEvent("content_generated", { type, pillar }),
  contentShared: (type) => trackEvent("content_shared", { type }),

  // Premium
  upgradeStarted: () => trackEvent("upgrade_started"),
  upgradeCompleted: () => trackEvent("upgrade_completed"),
  upgradeCancelled: () => trackEvent("upgrade_cancelled"),

  // Community
  postCreated: (pillar) => trackEvent("post_created", { pillar }),
  postLiked: (postId) => trackEvent("post_liked", { postId }),
  contentFlagged: (contentId, reason) =>
    trackEvent("content_flagged", { contentId, reason }),

  // Navigation
  pageViewed: (path, props) => trackPageView(path, props),
};

export default analytics;
