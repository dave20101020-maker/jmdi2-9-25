import { api } from "@/utils/apiClient";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SignIn from "@/pages/auth/SignIn";

export default function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const navigate = useNavigate();

  const extractStatus = (err) => {
    const raw = err?.status || err?.statusCode || err?.response?.status;
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const currentUser = await api.authMe();

      if (currentUser) {
        setUser(currentUser);
        setUnauthenticated(false);
        setRetryCount(0);
      } else {
        // Clean logged-out state: show login screen without redirect loops.
        setUser(null);
        setUnauthenticated(true);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      const status = extractStatus(err);
      if (status === 401 || status === 403) {
        setUser(null);
        setUnauthenticated(true);
        setError(null);
      } else {
        setUnauthenticated(false);
        setError(err?.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();

    const handleOnline = () => {
      setRetryCount(0);
      checkAuth();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);

      return () => {
        window.removeEventListener("online", handleOnline);
      };
    }

    return undefined;
  }, [checkAuth]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    checkAuth();
  };

  const handleSignIn = () => {
    navigate("/sign-in");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #0A1628, #1A1838)" }}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#D4AF37]" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-3xl animate-pulse">
              ⭐
            </div>
          </div>
          <p className="text-white/60 text-base">Loading NorthStar...</p>
        </div>
      </div>
    );
  }

  if (unauthenticated) {
    return <SignIn />;
  }

  if (error || !user) {
    const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "linear-gradient(to bottom, #0A1628, #1A1838)" }}
      >
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            {!isOnline ? (
              <Wifi className="w-10 h-10 text-red-400" />
            ) : (
              <RefreshCw className="w-10 h-10 text-red-400" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            {!isOnline ? "You're Offline" : "Connection Issue"}
          </h2>

          <p className="text-white/70 mb-6 text-base">
            {!isOnline
              ? "Please check your internet connection and try again."
              : error || "Unable to authenticate. Please try again."}
          </p>

          {retryCount > 0 && (
            <p className="text-white/50 text-sm mb-4">
              Retry attempt: {retryCount}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="btn-primary w-full py-6 text-base"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 py-6 text-base"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Pass user to children function
  return <>{typeof children === "function" ? children(user) : children}</>;
}
