import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RouteLoader from "@/components/fallbacks/RouteLoader";
import GlobalErrorBoundary from "@/components/shared/ErrorBoundary";
import { NAMED_ROUTES } from "@/config/routes";

const lazyPage = (loader, displayName) => {
  const Component = lazy(loader);
  Component.displayName = displayName || loader.name || "LazyPage";
  Component.preload = () => loader();
  return Component;
};

const MainLayout = lazyPage(
  () => import("@/components/Layout/MainLayout"),
  "MainLayout"
);
const DashboardPage = lazyPage(
  () => import("@/pages/Dashboard"),
  "DashboardPage"
);
const CommunityPage = lazyPage(
  () => import("@/pages/Community"),
  "CommunityPage"
);
const TrackPage = lazyPage(() => import("@/pages/Track"), "TrackPage");
const AnalyticsPage = lazyPage(
  () => import("@/pages/Analytics"),
  "AnalyticsPage"
);
const CoachSelectPage = lazyPage(
  () => import("@/pages/CoachSelect"),
  "CoachSelectPage"
);
const CoachPage = lazyPage(() => import("@/pages/Coach"), "CoachPage");
const ProfilePage = lazyPage(() => import("@/pages/Profile"), "ProfilePage");
const SettingsPage = lazyPage(() => import("@/pages/Settings"), "SettingsPage");
const SleepPage = lazyPage(() => import("@/pages/Sleep"), "SleepPage");
const DietPage = lazyPage(() => import("@/pages/Diet"), "DietPage");
const ExercisePage = lazyPage(() => import("@/pages/Exercise"), "ExercisePage");
const PhysicalHealthPage = lazyPage(
  () => import("@/pages/PhysicalHealth"),
  "PhysicalHealthPage"
);
const MentalHealthPage = lazyPage(
  () => import("@/pages/MentalHealth"),
  "MentalHealthPage"
);
const FinancesPage = lazyPage(() => import("@/pages/Finances"), "FinancesPage");
const SocialPage = lazyPage(() => import("@/pages/Social"), "SocialPage");
const SpiritualityPage = lazyPage(
  () => import("@/pages/Spirituality"),
  "SpiritualityPage"
);
const OnboardingPage = lazyPage(
  () => import("@/pages/Onboarding"),
  "OnboardingPage"
);
const CRITICAL_ROUTES = [DashboardPage, OnboardingPage];
const MyPlansPage = lazyPage(() => import("@/pages/MyPlans"), "MyPlansPage");
const PlanDetailPage = lazyPage(
  () => import("@/pages/PlanDetail"),
  "PlanDetailPage"
);
const DailyProgressPage = lazyPage(
  () => import("@/pages/DailyProgress"),
  "DailyProgressPage"
);
const WeeklyReflectionPage = lazyPage(
  () => import("@/pages/WeeklyReflection"),
  "WeeklyReflectionPage"
);
const WeeklyReportPage = lazyPage(
  () => import("@/pages/WeeklyReport"),
  "WeeklyReportPage"
);
const UpgradePage = lazyPage(() => import("@/pages/Upgrade"), "UpgradePage");
const PricingPage = lazyPage(() => import("@/pages/Pricing"), "PricingPage");
const PrivacyPage = lazyPage(
  () => import("@/pages/compliance/Privacy"),
  "PrivacyPage"
);
const TermsPage = lazyPage(
  () => import("@/pages/compliance/Terms"),
  "TermsPage"
);
const TrustCenterPage = lazyPage(
  () => import("@/pages/compliance/TrustCenter"),
  "TrustCenterPage"
);
const GoalsPage = lazyPage(() => import("@/pages/Goals"), "GoalsPage");
const MyGrowthPage = lazyPage(() => import("@/pages/MyGrowth"), "MyGrowthPage");
const MoodTrackerPage = lazyPage(
  () => import("@/pages/MoodTracker"),
  "MoodTrackerPage"
);
const HabitsPage = lazyPage(() => import("@/pages/Habits"), "HabitsPage");
const FriendsPage = lazyPage(() => import("@/pages/Friends"), "FriendsPage");
const MilestonesPage = lazyPage(
  () => import("@/pages/Milestones"),
  "MilestonesPage"
);
const ConnectionsPage = lazyPage(
  () => import("@/pages/Connections"),
  "ConnectionsPage"
);
const FeedbackPage = lazyPage(() => import("@/pages/Feedback"), "FeedbackPage");
const MeditationPage = lazyPage(
  () => import("@/pages/Meditation"),
  "MeditationPage"
);
const AchievementsPage = lazyPage(
  () => import("@/pages/Achievements"),
  "AchievementsPage"
);
const CheckInsPage = lazyPage(() => import("@/pages/CheckIns"), "CheckInsPage");
const MessagesPage = lazyPage(() => import("@/pages/Messages"), "MessagesPage");
const NotificationsPage = lazyPage(
  () => import("@/pages/Notifications"),
  "NotificationsPage"
);
const TimelinePage = lazyPage(() => import("@/pages/Timeline"), "TimelinePage");
const AdminDashboardPage = lazyPage(
  () => import("@/pages/AdminDashboard"),
  "AdminDashboardPage"
);
const AdminAnalyticsPage = lazyPage(
  () => import("@/pages/AdminAnalytics"),
  "AdminAnalyticsPage"
);
const PillarPage = lazyPage(
  () => import(/* webpackChunkName: "pillar-generic" */ "@/pages/Pillar"),
  "PillarPage"
);
const SleepDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-sleep" */ "@/pages/pillars/SleepDashboard"
    ),
  "SleepDashboardPage"
);
const DietDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-diet" */ "@/pages/pillars/DietDashboard"
    ),
  "DietDashboardPage"
);
const ExerciseDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-exercise" */
      "@/pages/pillars/ExerciseDashboard"
    ),
  "ExerciseDashboardPage"
);
const PhysicalHealthDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-physical" */
      "@/pages/pillars/PhysicalHealthDashboard"
    ),
  "PhysicalHealthDashboardPage"
);
const MentalHealthDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-mental" */
      "@/pages/pillars/MentalHealthDashboard"
    ),
  "MentalHealthDashboardPage"
);
const FinancesDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-finances" */
      "@/pages/pillars/FinancesDashboard"
    ),
  "FinancesDashboardPage"
);
const SocialDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-social" */
      "@/pages/pillars/SocialDashboard"
    ),
  "SocialDashboardPage"
);
const SpiritualityDashboardPage = lazyPage(
  () =>
    import(
      /* webpackChunkName: "pillar-spirituality" */
      "@/pages/pillars/SpiritualityDashboard"
    ),
  "SpiritualityDashboardPage"
);
const LoginPage = lazyPage(() => import("@/pages/Login"), "LoginPage");
const RegisterPage = lazyPage(() => import("@/pages/Register"), "RegisterPage");
const SignInPage = lazyPage(() => import("@/pages/auth/SignIn"), "SignInPage");
const SignUpPage = lazyPage(() => import("@/pages/auth/SignUp"), "SignUpPage");
const ForgotPasswordPage = lazyPage(
  () => import("@/pages/auth/ForgotPassword"),
  "ForgotPasswordPage"
);
const GoogleOAuthCallbackPage = lazyPage(
  () => import("@/pages/auth/GoogleOAuthCallback"),
  "GoogleOAuthCallbackPage"
);
const FacebookOAuthCallbackPage = lazyPage(
  () => import("@/pages/auth/FacebookOAuthCallback"),
  "FacebookOAuthCallbackPage"
);
const NotFoundPage = lazyPage(() => import("@/pages/NotFound"), "NotFoundPage");

const routeConfig = [
  {
    key: "dashboard",
    path: NAMED_ROUTES.Dashboard,
    Component: DashboardPage,
    label: "dashboard",
  },
  {
    key: "community",
    path: NAMED_ROUTES.Community,
    Component: CommunityPage,
    label: "community",
  },
  {
    key: "track",
    path: NAMED_ROUTES.Track,
    Component: TrackPage,
    label: "tracking",
  },
  {
    key: "analytics",
    path: NAMED_ROUTES.Analytics,
    Component: AnalyticsPage,
    label: "analytics",
  },
  {
    key: "coach-select",
    path: NAMED_ROUTES.CoachSelect,
    Component: CoachSelectPage,
    label: "coach selection",
  },
  {
    key: "coach",
    path: NAMED_ROUTES.Coach,
    Component: CoachPage,
    label: "coach",
  },
  {
    key: "profile",
    path: NAMED_ROUTES.Profile,
    Component: ProfilePage,
    label: "profile",
  },
  {
    key: "settings",
    path: NAMED_ROUTES.Settings,
    Component: SettingsPage,
    label: "settings",
  },
  {
    key: "sleep",
    path: NAMED_ROUTES.Sleep,
    Component: SleepPage,
    label: "sleep",
  },
  {
    key: "diet",
    path: NAMED_ROUTES.Diet,
    Component: DietPage,
    label: "nutrition",
  },
  {
    key: "exercise",
    path: NAMED_ROUTES.Exercise,
    Component: ExercisePage,
    label: "exercise",
  },
  {
    key: "physical-health",
    path: NAMED_ROUTES.PhysicalHealth,
    Component: PhysicalHealthPage,
    label: "physical health",
  },
  {
    key: "mental-health",
    path: NAMED_ROUTES.MentalHealth,
    Component: MentalHealthPage,
    label: "mental health",
  },
  {
    key: "finances",
    path: NAMED_ROUTES.Finances,
    Component: FinancesPage,
    label: "finances",
  },
  {
    key: "social",
    path: NAMED_ROUTES.Social,
    Component: SocialPage,
    label: "social",
  },
  {
    key: "spirituality",
    path: NAMED_ROUTES.Spirituality,
    Component: SpiritualityPage,
    label: "spirituality",
  },
  {
    key: "onboarding",
    path: NAMED_ROUTES.Onboarding,
    Component: OnboardingPage,
    label: "onboarding",
  },
  {
    key: "my-plans",
    path: NAMED_ROUTES.MyPlans,
    Component: MyPlansPage,
    label: "plans",
  },
  {
    key: "plan-detail",
    path: NAMED_ROUTES.PlanDetail,
    Component: PlanDetailPage,
    label: "plan details",
  },
  {
    key: "daily-progress",
    path: NAMED_ROUTES.DailyProgress,
    Component: DailyProgressPage,
    label: "daily progress",
  },
  {
    key: "weekly-reflection",
    path: NAMED_ROUTES.WeeklyReflection,
    Component: WeeklyReflectionPage,
    label: "weekly reflection",
  },
  {
    key: "weekly-report",
    path: NAMED_ROUTES.WeeklyReport,
    Component: WeeklyReportPage,
    label: "weekly report",
  },
  {
    key: "upgrade",
    path: NAMED_ROUTES.Upgrade,
    Component: UpgradePage,
    label: "upgrade",
  },
  {
    key: "pricing",
    path: NAMED_ROUTES.Pricing,
    Component: PricingPage,
    label: "pricing",
    isProtected: false,
  },
  {
    key: "privacy",
    path: NAMED_ROUTES.Privacy,
    Component: PrivacyPage,
    label: "privacy",
    isProtected: false,
  },
  {
    key: "terms",
    path: NAMED_ROUTES.Terms,
    Component: TermsPage,
    label: "terms",
    isProtected: false,
  },
  {
    key: "trust-center",
    path: NAMED_ROUTES.TrustCenter,
    Component: TrustCenterPage,
    label: "trust center",
    isProtected: false,
  },
  {
    key: "goals",
    path: NAMED_ROUTES.Goals,
    Component: GoalsPage,
    label: "goals",
  },
  {
    key: "my-growth",
    path: NAMED_ROUTES.MyGrowth,
    Component: MyGrowthPage,
    label: "growth",
  },
  {
    key: "mood-tracker",
    path: NAMED_ROUTES.MoodTracker,
    Component: MoodTrackerPage,
    label: "mood tracker",
  },
  {
    key: "habits",
    path: NAMED_ROUTES.Habits,
    Component: HabitsPage,
    label: "habits",
  },
  {
    key: "friends",
    path: NAMED_ROUTES.Friends,
    Component: FriendsPage,
    label: "friends",
  },
  {
    key: "milestones",
    path: NAMED_ROUTES.Milestones,
    Component: MilestonesPage,
    label: "milestones",
  },
  {
    key: "connections",
    path: NAMED_ROUTES.Connections,
    Component: ConnectionsPage,
    label: "connections",
  },
  {
    key: "feedback",
    path: NAMED_ROUTES.Feedback,
    Component: FeedbackPage,
    label: "feedback",
  },
  {
    key: "meditation",
    path: NAMED_ROUTES.Meditation,
    Component: MeditationPage,
    label: "meditation",
  },
  {
    key: "achievements",
    path: NAMED_ROUTES.Achievements,
    Component: AchievementsPage,
    label: "achievements",
  },
  {
    key: "check-ins",
    path: NAMED_ROUTES.CheckIns,
    Component: CheckInsPage,
    label: "check-ins",
  },
  {
    key: "messages",
    path: NAMED_ROUTES.Messages,
    Component: MessagesPage,
    label: "messages",
  },
  {
    key: "notifications",
    path: NAMED_ROUTES.Notifications,
    Component: NotificationsPage,
    label: "notifications",
  },
  {
    key: "timeline",
    path: NAMED_ROUTES.Timeline,
    Component: TimelinePage,
    label: "timeline",
  },
  {
    key: "admin",
    path: NAMED_ROUTES.AdminDashboard,
    Component: AdminDashboardPage,
    label: "admin",
  },
  {
    key: "admin-analytics",
    path: "/admin/analytics",
    Component: AdminAnalyticsPage,
    label: "admin analytics",
  },
  {
    key: "pillar-generic",
    path: "pillar/:pillarId",
    Component: PillarPage,
    label: "pillar",
  },
  {
    key: "pillar-sleep",
    path: "pillar/sleep",
    Component: SleepDashboardPage,
    label: "sleep insights",
  },
  {
    key: "pillar-diet",
    path: "pillar/diet",
    Component: DietDashboardPage,
    label: "diet insights",
  },
  {
    key: "pillar-exercise",
    path: "pillar/exercise",
    Component: ExerciseDashboardPage,
    label: "exercise insights",
  },
  {
    key: "pillar-physical-health",
    path: "pillar/physical-health",
    Component: PhysicalHealthDashboardPage,
    label: "physical pillar",
  },
  {
    key: "pillar-mental-health",
    path: "pillar/mental-health",
    Component: MentalHealthDashboardPage,
    label: "mental pillar",
  },
  {
    key: "pillar-finances",
    path: "pillar/finances",
    Component: FinancesDashboardPage,
    label: "finance pillar",
  },
  {
    key: "pillar-social",
    path: "pillar/social",
    Component: SocialDashboardPage,
    label: "social pillar",
  },
  {
    key: "pillar-spirituality",
    path: "pillar/spirituality",
    Component: SpiritualityDashboardPage,
    label: "spiritual pillar",
  },
];

const authRoutes = [
  { key: "login", path: "/login", Component: LoginPage },
  { key: "sign-in", path: "/sign-in", Component: SignInPage },
  { key: "register", path: "/register", Component: RegisterPage },
  { key: "sign-up", path: "/sign-up", Component: SignUpPage },
  {
    key: "forgot-password",
    path: "/forgot-password",
    Component: ForgotPasswordPage,
  },
  {
    key: "google-oauth-callback",
    path: NAMED_ROUTES.GoogleOAuthCallback,
    Component: GoogleOAuthCallbackPage,
  },
  {
    key: "facebook-oauth-callback",
    path: NAMED_ROUTES.FacebookOAuthCallback,
    Component: FacebookOAuthCallbackPage,
  },
];

const normalizeNestedPath = (path) => {
  if (typeof path !== "string") return path;
  return path.startsWith("/") ? path.slice(1) : path;
};

const renderRoute = (
  Component,
  { isProtected = true, loadingMessage } = {}
) => {
  const fallbackMessage = loadingMessage || "Calibrating mission HUD...";

  const content = (
    <Suspense fallback={<RouteLoader message={fallbackMessage} />}>
      <Component />
    </Suspense>
  );

  if (!isProtected) {
    return <GlobalErrorBoundary>{content}</GlobalErrorBoundary>;
  }

  return (
    <GlobalErrorBoundary>
      <ProtectedRoute>{content}</ProtectedRoute>
    </GlobalErrorBoundary>
  );
};

export default function AppRouter() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const preloadCriticalRoutes = () => {
      CRITICAL_ROUTES.forEach((Component) => {
        if (Component?.preload) {
          Component.preload();
        }
      });
    };

    let idleHandle;
    let timeoutHandle;

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(preloadCriticalRoutes);
    } else {
      timeoutHandle = window.setTimeout(preloadCriticalRoutes, 0);
    }

    return () => {
      if (idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, []);

  const mainLayoutElement = (
    <GlobalErrorBoundary>
      <Suspense fallback={<RouteLoader message="Aligning command deck..." />}>
        <MainLayout />
      </Suspense>
    </GlobalErrorBoundary>
  );

  return (
    <Routes>
      {authRoutes.map(({ key, path, Component }) => (
        <Route
          key={key}
          path={path}
          element={renderRoute(Component, {
            isProtected: false,
            loadingMessage: "Preparing secure access...",
          })}
        />
      ))}

      <Route path="/" element={mainLayoutElement}>
        <Route
          index
          element={<Navigate to={NAMED_ROUTES.Dashboard} replace />}
        />
        {routeConfig.map(({ key, path, Component, isProtected, label }) => (
          <Route
            key={key}
            path={normalizeNestedPath(path)}
            element={renderRoute(Component, {
              isProtected: isProtected !== false,
              loadingMessage: `Loading ${label || key}...`,
            })}
          />
        ))}
      </Route>

      <Route
        path="*"
        element={renderRoute(NotFoundPage, {
          isProtected: false,
          loadingMessage: "Searching the galaxy...",
        })}
      />
    </Routes>
  );
}
