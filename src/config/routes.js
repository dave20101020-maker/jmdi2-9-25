export const NAMED_ROUTES = Object.freeze({
  Dashboard: "/dashboard",
  Community: "/community",
  Track: "/track",
  Analytics: "/analytics",
  CoachSelect: "/coach-select",
  Coach: "/coach",
  Profile: "/profile",
  Settings: "/settings",
  Sleep: "/sleep",
  Diet: "/diet",
  Exercise: "/exercise",
  PhysicalHealth: "/physical-health",
  MentalHealth: "/mental-health",
  Finances: "/finances",
  Social: "/social",
  Spirituality: "/spirituality",
  Onboarding: "/onboarding",
  MyPlans: "/my-plans",
  PlanDetail: "/plan-detail",
  DailyProgress: "/daily-progress",
  WeeklyReflection: "/weekly-reflection",
  WeeklyReport: "/weekly-report",
  Messages: "/messages",
  Notifications: "/notifications",
  Timeline: "/timeline",
  Upgrade: "/upgrade",
  Pricing: "/pricing",
  Privacy: "/privacy",
  Terms: "/terms",
  TrustCenter: "/trust-center",
  Goals: "/goals",
  MyGrowth: "/my-growth",
  MoodTracker: "/mood-tracker",
  Habits: "/habits",
  Friends: "/friends",
  Milestones: "/milestones",
  Connections: "/connections",
  Feedback: "/feedback",
  Meditation: "/meditation",
  Achievements: "/achievements",
  CheckIns: "/check-ins",
  Pillars: "/pillars",
  AdminDashboard: "/admin",
  GoogleOAuthCallback: "/auth/google/callback",
  FacebookOAuthCallback: "/auth/facebook/callback",
});

const normalizedLookup = Object.entries(NAMED_ROUTES).reduce(
  (acc, [name, path]) => {
    acc[name.toLowerCase()] = path;
    return acc;
  },
  {}
);

const sanitizeFallback = (value) => {
  const normalized = value.replace(/[^a-z0-9/ -]/gi, "-").replace(/-+/g, "-");
  const trimmed = normalized.replace(/^-+|-+$/g, "");
  return trimmed ? `/${trimmed.toLowerCase()}` : "/";
};

export const getRoutePath = (name, defaultPath = "/") => {
  if (!name || typeof name !== "string") {
    return defaultPath;
  }

  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) {
    return defaultPath;
  }

  return normalizedLookup[normalizedName] || sanitizeFallback(normalizedName);
};
