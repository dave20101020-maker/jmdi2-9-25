import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ConsentBanner from "./components/ConsentBanner";
import { useConsent } from "@/hooks/useConsent";
import "./App.css";
import { Toaster as SonnerToaster } from "sonner";
import StarfieldBackground from "@/components/visuals/StarfieldBackground";
import Dashboard from "@/pages/Dashboard";
import Track from "@/pages/Track";
import Community from "@/pages/Community";
import Analytics from "@/pages/Analytics";
import CoachSelect from "@/pages/CoachSelect";
import Coach from "@/pages/Coach";
import Profile from "@/pages/Profile";
import Sleep from "@/pages/Sleep";
import Diet from "@/pages/Diet";
import Exercise from "@/pages/Exercise";
import PhysicalHealth from "@/pages/PhysicalHealth";
import MentalHealth from "@/pages/MentalHealth";
import Finances from "@/pages/Finances";
import Social from "@/pages/Social";
import Spirituality from "@/pages/Spirituality";
import Onboarding from "@/pages/Onboarding";
import MyPlans from "@/pages/MyPlans";
import PlanDetail from "@/pages/PlanDetail";
import DailyProgress from "@/pages/DailyProgress";
import WeeklyReflection from "@/pages/WeeklyReflection";
import WeeklyReport from "@/pages/WeeklyReport";
import Upgrade from "@/pages/Upgrade";
import Pricing from "@/pages/Pricing";
import Goals from "@/pages/Goals";
import MyGrowth from "@/pages/MyGrowth";
import MoodTracker from "@/pages/MoodTracker";
import Habits from "@/pages/Habits";
import Friends from "@/pages/Friends";
import Milestones from "@/pages/Milestones";
import Connections from "@/pages/Connections";
import Feedback from "@/pages/Feedback";
import Meditation from "@/pages/Meditation";
import Achievements from "@/pages/Achievements";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import Timeline from "@/pages/Timeline";
import Pillar from "@/pages/Pillar";
import Settings from "@/pages/Settings";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import { NAMED_ROUTES } from "@/config/routes";

const stripLeadingSlash = (value = "") =>
  value.startsWith("/") ? value.slice(1) : value;

const APP_SHELL_ROUTES = [
  { key: "dashboard", path: NAMED_ROUTES.Dashboard, Component: Dashboard },
  { key: "community", path: NAMED_ROUTES.Community, Component: Community },
  { key: "track", path: NAMED_ROUTES.Track, Component: Track },
  { key: "analytics", path: NAMED_ROUTES.Analytics, Component: Analytics },
  {
    key: "coach-select",
    path: NAMED_ROUTES.CoachSelect,
    Component: CoachSelect,
  },
  { key: "coach", path: NAMED_ROUTES.Coach, Component: Coach },
  { key: "profile", path: NAMED_ROUTES.Profile, Component: Profile },
  { key: "settings", path: NAMED_ROUTES.Settings, Component: Settings },
  { key: "onboarding", path: NAMED_ROUTES.Onboarding, Component: Onboarding },
  { key: "pillar", path: "pillar/:pillarId", Component: Pillar },
  { key: "sleep", path: NAMED_ROUTES.Sleep, Component: Sleep },
  { key: "diet", path: NAMED_ROUTES.Diet, Component: Diet },
  { key: "exercise", path: NAMED_ROUTES.Exercise, Component: Exercise },
  {
    key: "physical-health",
    path: NAMED_ROUTES.PhysicalHealth,
    Component: PhysicalHealth,
  },
  {
    key: "mental-health",
    path: NAMED_ROUTES.MentalHealth,
    Component: MentalHealth,
  },
  { key: "finances", path: NAMED_ROUTES.Finances, Component: Finances },
  { key: "social", path: NAMED_ROUTES.Social, Component: Social },
  {
    key: "spirituality",
    path: NAMED_ROUTES.Spirituality,
    Component: Spirituality,
  },
  { key: "my-plans", path: NAMED_ROUTES.MyPlans, Component: MyPlans },
  { key: "plan-detail", path: NAMED_ROUTES.PlanDetail, Component: PlanDetail },
  {
    key: "daily-progress",
    path: NAMED_ROUTES.DailyProgress,
    Component: DailyProgress,
  },
  {
    key: "weekly-reflection",
    path: NAMED_ROUTES.WeeklyReflection,
    Component: WeeklyReflection,
  },
  {
    key: "weekly-report",
    path: NAMED_ROUTES.WeeklyReport,
    Component: WeeklyReport,
  },
  { key: "messages", path: NAMED_ROUTES.Messages, Component: Messages },
  {
    key: "notifications",
    path: NAMED_ROUTES.Notifications,
    Component: Notifications,
  },
  { key: "timeline", path: NAMED_ROUTES.Timeline, Component: Timeline },
  { key: "upgrade", path: NAMED_ROUTES.Upgrade, Component: Upgrade },
  {
    key: "pricing",
    path: NAMED_ROUTES.Pricing,
    Component: Pricing,
    isProtected: false,
  },
  { key: "goals", path: NAMED_ROUTES.Goals, Component: Goals },
  { key: "my-growth", path: NAMED_ROUTES.MyGrowth, Component: MyGrowth },
  {
    key: "mood-tracker",
    path: NAMED_ROUTES.MoodTracker,
    Component: MoodTracker,
  },
  { key: "habits", path: NAMED_ROUTES.Habits, Component: Habits },
  { key: "friends", path: NAMED_ROUTES.Friends, Component: Friends },
  {
    key: "milestones",
    path: NAMED_ROUTES.Milestones,
    Component: Milestones,
  },
  {
    key: "connections",
    path: NAMED_ROUTES.Connections,
    Component: Connections,
  },
  { key: "feedback", path: NAMED_ROUTES.Feedback, Component: Feedback },
  {
    key: "meditation",
    path: NAMED_ROUTES.Meditation,
    Component: Meditation,
  },
  {
    key: "achievements",
    path: NAMED_ROUTES.Achievements,
    Component: Achievements,
  },
  {
    key: "admin",
    path: NAMED_ROUTES.AdminDashboard,
    Component: AdminDashboard,
  },
];

function AppContent() {
  const { hasConsent, isLoading: consentLoading } = useConsent();
  const [showBanner, setShowBanner] = useState(!hasConsent && !consentLoading);

  const handleConsentGiven = () => {
    setShowBanner(false);
  };

  return (
    <>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={<Navigate to={NAMED_ROUTES.Dashboard} replace />}
          />
          {APP_SHELL_ROUTES.map(
            ({ key, path, Component, isProtected = true }) => (
              <Route
                key={key}
                path={stripLeadingSlash(path)}
                element={
                  isProtected ? (
                    <ProtectedRoute>
                      <Component />
                    </ProtectedRoute>
                  ) : (
                    <Component />
                  )
                }
              />
            )
          )}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {showBanner && !consentLoading && (
        <ConsentBanner onConsentGiven={handleConsentGiven} />
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="ns-app-surface">
            <StarfieldBackground />
            <div className="ns-app-surface__content">
              <AppContent />
              <SonnerToaster position="top-right" richColors closeButton />
            </div>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
