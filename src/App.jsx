import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider";
import AppShell from "./components/layout/AppShell";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import StarfieldBackground from "@/components/visuals/StarfieldBackground";
import { Toaster as SonnerToaster } from "sonner";
import AuthGuard from "./components/auth/AuthGuard";
import CheckIns from "./pages/CheckIns";
import PillarPage from "./pages/pillars/PillarPage";
import {
  SleepPillarPage,
  DietPillarPage,
  ExercisePillarPage,
  PhysicalHealthPillarPage,
  MentalHealthPillarPage,
  FinancesPillarPage,
  SocialPillarPage,
  SpiritualityPillarPage,
} from "./pages/pillars/PillarDetailScreens";
import queryClient from "./app/queryClient";
import Pillars from "@/pages/Pillars";
import { NAMED_ROUTES } from "@/config/routes";
import CoachHub from "./pages/coach/CoachHub";
import NorthStarAssistant from "@/ai/NorthStarAssistant";
import Privacy from "./pages/compliance/Privacy";
import Terms from "./pages/compliance/Terms";
import TrustCenter from "./pages/compliance/TrustCenter";

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
              <Dashboard />
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
              <SleepPillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/diet"
          element={
            <AuthGuard>
              <DietPillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/exercise"
          element={
            <AuthGuard>
              <ExercisePillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/physical_health"
          element={
            <AuthGuard>
              <PhysicalHealthPillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/mental_health"
          element={
            <AuthGuard>
              <MentalHealthPillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/finances"
          element={
            <AuthGuard>
              <FinancesPillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/social"
          element={
            <AuthGuard>
              <SocialPillarPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pillars/spirituality"
          element={
            <AuthGuard>
              <SpiritualityPillarPage />
            </AuthGuard>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/trust-center" element={<TrustCenter />} />
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
          <div className="ns-app-surface">
            <StarfieldBackground />
            <div className="ns-app-surface__content">
              <AppRoutes />
              <NorthStarAssistant />
              <SonnerToaster position="top-right" richColors closeButton />
            </div>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
