import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Pillar from "./pages/Pillar";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ConsentBanner from "./components/ConsentBanner";
import { useConsent } from "@/hooks/useConsent";
import "./App.css";

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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="pillar/:pillarId"
            element={
              <ProtectedRoute>
                <Pillar />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="pricing" element={<Pricing />} />
        </Route>

        <Route
          path="*"
          element={<div style={{ padding: 20 }}>404 - Not Found</div>}
        />
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
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
