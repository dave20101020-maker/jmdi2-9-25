import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";

export default function ApiErrorToast() {
  const [detail, setDetail] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handler = (e) => {
      // Guard: only show toast if explicitly marked as user-visible
      if (e?.detail?.__suppressToast === true) {
        return;
      }

      // Never show auth-required toasts automatically
      // Auth messaging is handled explicitly by auth flows
      if (e?.detail?.__authRequired === true) {
        return;
      }

      setDetail(e?.detail ?? null);
    };
    window.addEventListener("api-error", handler);
    return () => window.removeEventListener("api-error", handler);
  }, []);

  const message = detail ? normalizeErrorMessage(detail, "API error") : null;
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const shouldSuppressInDemo =
    Boolean(detail) &&
    isDemoMode &&
    typeof message === "string" &&
    /session|unauthenticated/i.test(message);

  const shouldSuppressAuthNoise =
    Boolean(detail) &&
    typeof detail === "object" &&
    (detail?.status === 401 || detail?.status === 403) &&
    (detail?.path === "/auth/me" || detail?.path === "/auth/refresh") &&
    location.pathname !== "/login" &&
    location.pathname !== "/register" &&
    location.pathname !== "/sign-in" &&
    location.pathname !== "/sign-up";

  useEffect(() => {
    if (shouldSuppressInDemo) {
      setDetail(null);
    }
  }, [shouldSuppressInDemo]);

  useEffect(() => {
    if (shouldSuppressAuthNoise) {
      setDetail(null);
    }
  }, [shouldSuppressAuthNoise]);

  if (!detail) return null;

  if (shouldSuppressInDemo) return null;

  if (shouldSuppressAuthNoise) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-600 text-white p-3 rounded shadow">
        <div className="font-semibold">Error</div>
        <div className="text-sm">{message}</div>
        <button className="mt-2 underline" onClick={() => setDetail(null)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
