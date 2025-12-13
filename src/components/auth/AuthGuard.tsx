import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import RouteLoader from "@/components/fallbacks/RouteLoader";
import { api } from "@/utils/apiClient";

const normalizeUser = (payload: unknown) => {
  if (payload && typeof payload === "object") {
    const asRecord = payload as Record<string, unknown>;
    return (asRecord.data as unknown) ?? (asRecord.user as unknown) ?? payload;
  }
  return payload;
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["session"],
    queryFn: async () => normalizeUser(await api.me()),
    retry: false,
  });

  if (isLoading) {
    return <RouteLoader message="Verifying your NorthStar session..." />;
  }

  const status =
    // @ts-expect-error axios/fetch error normalisation
    error?.status || error?.statusCode || error?.response?.status;
  if (isError && status === 401) {
    return (
      <Navigate
        to={redirectTarget}
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }

  if (!data) {
    return (
      <Navigate
        to={redirectTarget}
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }

  return <>{children}</>;
}
