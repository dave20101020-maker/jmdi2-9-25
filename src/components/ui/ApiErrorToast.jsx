import React, { useEffect, useState } from "react";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";

export default function ApiErrorToast() {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const handler = (e) => {
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

  useEffect(() => {
    if (shouldSuppressInDemo) {
      setDetail(null);
    }
  }, [shouldSuppressInDemo]);

  if (!detail) return null;

  if (shouldSuppressInDemo) return null;

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
