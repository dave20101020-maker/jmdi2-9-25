import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider";
import AppShell from "./components/layout/AppShell";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Onboarding from "./pages/Onboarding";
import DashboardNorthStar from "./pages/northstar/DashboardNorthStar";
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
import NorthStarAssistant from "@/ai/NorthStarAssistant";
import Privacy from "./pages/compliance/Privacy";
import Terms from "./pages/compliance/Terms";
import TrustCenter from "./pages/compliance/TrustCenter";
import SettingsNorthStar from "./pages/northstar/SettingsNorthStar";
import TimelineNorthStar from "./pages/northstar/TimelineNorthStar";
import NeuroShield from "./pages/northstar/NeuroShield";
import LifePlanningAI from "./pages/northstar/LifePlanningAI";
import Leaderboards from "./pages/northstar/Leaderboards";
import FloatingCopilotButton from "./components/FloatingCopilotButton";

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

      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardNorthStar />
            </AuthGuard>
          }
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
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppLayout>
            <AppRoutes />
            <NorthStarAssistant />
            <FloatingCopilotButton />
            <SonnerToaster position="top-right" richColors closeButton />
          </AppLayout>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
