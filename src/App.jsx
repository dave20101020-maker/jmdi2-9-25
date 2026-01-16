import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider";
import AppShell from "./components/layout/AppShell";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import MissionControlRoot from "./missionControl/MissionControlRoot";
import Habits from "./pages/Habits";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import StarfieldBackground from "@/components/visuals/StarfieldBackground";
import { Toaster as SonnerToaster } from "sonner";
import AuthGuard from "./components/auth/AuthGuard";
import CheckIns from "./pages/CheckIns";
import PillarPage from "./pages/pillars/PillarPage";
import SleepPillarSpec from "./pages/northstar/SleepPillarSpec";
import DietPillarSpec from "./pages/northstar/DietPillarSpec";
import ExercisePillarSpec from "./pages/northstar/ExercisePillarSpec";
import MentalHealthPillarSpec from "./pages/northstar/MentalHealthPillarSpec";
import PhysicalHealthPillarSpec from "./pages/northstar/PhysicalHealthPillarSpec";
import FinancePillarSpec from "./pages/northstar/FinancePillarSpec";
import SocialPillarSpec from "./pages/northstar/SocialPillarSpec";
import SpiritualityPillarSpec from "./pages/northstar/SpiritualityPillarSpec";
import queryClient from "./app/queryClient";
import Pillars from "@/pages/Pillars";
import { NAMED_ROUTES } from "@/config/routes";
import CoachHub from "./pages/coach/CoachHub";
import Privacy from "./pages/compliance/Privacy";
import Terms from "./pages/compliance/Terms";
import TrustCenter from "./pages/compliance/TrustCenter";
import SettingsNorthStar from "./pages/northstar/SettingsNorthStar";
import TimelineNorthStar from "./pages/northstar/TimelineNorthStar";
import NeuroShield from "./pages/northstar/NeuroShield";
import LifePlanningAI from "./pages/northstar/LifePlanningAI";
import Leaderboards from "./pages/northstar/Leaderboards";
import Analytics from "./pages/Analytics";
import WeeklyReflection from "./pages/WeeklyReflection";
import WeeklyReport from "./pages/WeeklyReport";
import ApiErrorToast from "./components/ui/ApiErrorToast";
import { AuthProvider } from "@/hooks/useAuth";
import NorthStarLoader from "@/components/NorthStarLoader";
import { useAuth } from "@/hooks/useAuth";
import useAppStore from "@/store/useAppStore";
import AppOverlays from "@/overlays/AppOverlays";

function AppLayout({ children }) {
  return (
    <div className="ns-app-surface">
      <StarfieldBackground />
      <div className="ns-app-surface__content relative z-10">{children}</div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/sign-in" element={<Navigate to="/login" replace />} />
      <Route
        path="/sign-up"
        element={<Navigate to="/register" replace />} // legacy alias
      />

      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/mission-control" replace />} />
        <Route path="/mission-control" element={<MissionControlRoot />} />
        <Route
          path="/dashboard"
          element={<Navigate to="/mission-control" replace />}
        />
        <Route
          path="/pillars/:pillarId"
          element={
            <AuthGuard>
              <PillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/sleep"
          element={
            <AuthGuard>
              <SleepPillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/diet"
          element={
            <AuthGuard>
              <DietPillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/exercise"
          element={
            <AuthGuard>
              <ExercisePillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/physical_health"
          element={
            <AuthGuard>
              <PhysicalHealthPillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/mental_health"
          element={
            <AuthGuard>
              <MentalHealthPillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/finances"
          element={
            <AuthGuard>
              <FinancePillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/social"
          element={
            <AuthGuard>
              <SocialPillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/spirituality"
          element={
            <AuthGuard>
              <SpiritualityPillarSpec />
            </AuthGuard>
          }
        />
        <Route
          path="/timeline"
          element={
            <AuthGuard>
              <TimelineNorthStar />
            </AuthGuard>
          }
        />
        <Route
          path="/neuroshield"
          element={
            <AuthGuard>
              <NeuroShield />
            </AuthGuard>
          }
        />
        <Route
          path="/life-planning"
          element={
            <AuthGuard>
              <LifePlanningAI />
            </AuthGuard>
          }
        />
        <Route
          path="/friends"
          element={
            <AuthGuard>
              <Leaderboards />
            </AuthGuard>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/trust-center" element={<TrustCenter />} />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <SettingsNorthStar />
            </AuthGuard>
          }
        />
        <Route path={NAMED_ROUTES.Pillars} element={<Pillars />} />
        <Route
          path="/coaches"
          element={
            <AuthGuard>
              <CoachHub />
            </AuthGuard>
          }
        />

        <Route
          path="/analytics"
          element={
            <AuthGuard>
              <Analytics />
            </AuthGuard>
          }
        />
        <Route
          path="/weekly-reflection"
          element={
            <AuthGuard>
              <WeeklyReflection />
            </AuthGuard>
          }
        />
        <Route
          path="/weekly-report"
          element={
            <AuthGuard>
              <WeeklyReport />
            </AuthGuard>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppFrame() {
  const { loading, initializing } = useAuth();
  const appIsLoading = useAppStore((state) => Boolean(state.ui?.isLoading));
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const authIsLoading = Boolean(loading || initializing);
  const showLoader = appIsLoading || authIsLoading || !appReady;

  return (
    <AppLayout>
      <NorthStarLoader visible={showLoader} />
      <ApiErrorToast />
      <AppRoutes />
      <AppOverlays />
      <SonnerToaster position="top-right" richColors closeButton />
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppFrame />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
