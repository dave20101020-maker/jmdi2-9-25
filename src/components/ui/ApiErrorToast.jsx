import React, { useEffect, useState } from "react";

const normalizeError = (error) => {
  if (!error) return "API error";
  if (typeof error === "string") return error;
  if (typeof error.message === "string") return error.message;
  if (error.body) {
    if (typeof error.body === "string") return error.body;
    if (typeof error.body.message === "string") return error.body.message;
  }
  if (error.response) {
    const data = error.response.data;
    if (typeof data === "string") return data;
    if (data && typeof data.message === "string") return data.message;
  }
  if (typeof error.statusText === "string") return error.statusText;
  return String(error);
};

export default function ApiErrorToast() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setMessage(normalizeError(e?.detail));
    };
    window.addEventListener("api-error", handler);
    return () => window.removeEventListener("api-error", handler);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-600 text-white p-3 rounded shadow">
        <div className="font-semibold">Error</div>
        <div className="text-sm">{message}</div>
        <button className="mt-2 underline" onClick={() => setMessage(null)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
