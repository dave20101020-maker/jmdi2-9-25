import React, { useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import RouteLoader from "@/components/fallbacks/RouteLoader";
import { api } from "@/utils/apiClient";
import Login from "@/pages/Login";

const normalizeUser = (payload: unknown) => {
  if (payload && typeof payload === "object") {
    const asRecord = payload as Record<string, unknown>;
    return (asRecord.data as unknown) ?? (asRecord.user as unknown) ?? payload;
  }
  return payload;
};

const extractStatus = (err: unknown) => {
  if (!err || typeof err !== "object") return null;
  const asAny = err as any;
  const raw = asAny?.status || asAny?.statusCode || asAny?.response?.status;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export default function AuthGuard({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const location = useLocation();
  const redirectTarget = redirectTo || "/login";

  const [sessionChecked, setSessionChecked] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const allowGuest = import.meta.env.DEV;
  const shouldRedirect = useMemo(() => {
    if (allowGuest) return false;
    return Boolean(redirectTo);
  }, [allowGuest, redirectTo]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: async () => normalizeUser(await api.me()),
    retry: false,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !unauthenticated,
    onSuccess: () => {
      setSessionChecked(true);
      setUnauthenticated(false);
    },
    onError: (err) => {
      const status = extractStatus(err);
      if (status === 401 || status === 403) {
        setUnauthenticated(true);
      }
      setSessionChecked(true);
    },
  });

  if (!sessionChecked && isLoading) {
    return <RouteLoader message="Verifying your NorthStar session..." />;
  }

  const status = extractStatus(error);
  if (isError && (status === 401 || status === 403 || unauthenticated)) {
    // 401/403 is a normal logged-out state. Render the login screen without
    // changing the current route (no redirects).
    return <Login />;
  }

  // Avoid redirecting during unknown/network/server errors.
  if (isError) {
    return (
      <div className="relative">
        <RouteLoader message="Unable to verify your session right now." />
        <div className="absolute inset-0 flex items-end justify-center pb-10">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-full bg-white/10 text-white border border-white/20 shadow-lg hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D03F]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Session call succeeded but no user was returned.
  if (!data) {
    // Treat missing user the same as unauthenticated.
    return <Login />;
  }

  return <>{children}</>;
}
