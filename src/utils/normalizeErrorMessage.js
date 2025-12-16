import * as React from "react";

const truncate = (value, maxLen = 260) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
};

const safeStringify = (value) => {
  try {
    const seen = new WeakSet();
    return JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === "bigint") return v.toString();
        if (typeof v === "function") return undefined;
        if (typeof v === "object" && v !== null) {
          if (seen.has(v)) return "[Circular]";
          seen.add(v);
        }
        return v;
      },
      2
    );
  } catch {
    return null;
  }
};

/**
 * Normalize arbitrary error-ish values into a safe display string.
 * Intentionally conservative: prefers common `message`/`error` fields and
 * avoids leaking large/circular objects.
 */
export const normalizeErrorMessage = (
  input,
  fallback = "Something went wrong"
) => {
  if (input === null || input === undefined) return fallback;

  if (typeof input === "string") return truncate(input) || fallback;

  if (
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "bigint"
  ) {
    return truncate(String(input)) || fallback;
  }

  // React elements should not be coerced to string.
  if (React.isValidElement(input)) return fallback;

  // Arrays: join any usable messages.
  if (Array.isArray(input)) {
    const parts = input
      .map((item) => normalizeErrorMessage(item, ""))
      .map((msg) => (typeof msg === "string" ? msg.trim() : ""))
      .filter(Boolean);
    return truncate(parts.join(", ")) || fallback;
  }

  if (typeof input === "object") {
    const err = input;

    // Common fields
    const directCandidates = [
      err?.message,
      err?.error,
      err?.statusText,
      err?.reason,
      err?.title,
    ];
    for (const candidate of directCandidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return truncate(candidate);
      }
    }

    // Event detail wrapper
    if (err?.detail) {
      return normalizeErrorMessage(err.detail, fallback);
    }

    // APIClient event shapes: { status, body } or { status, error }
    if (err?.error) {
      return normalizeErrorMessage(err.error, fallback);
    }

    if (err?.body) {
      const body = err.body;
      if (typeof body === "string" && body.trim()) return truncate(body);
      if (typeof body?.message === "string" && body.message.trim()) {
        return truncate(body.message);
      }
      if (typeof body?.error === "string" && body.error.trim()) {
        return truncate(body.error);
      }
    }

    // axios-like shape
    if (err?.response) {
      const data = err.response?.data;
      if (typeof data === "string" && data.trim()) return truncate(data);
      if (typeof data?.message === "string" && data.message.trim()) {
        return truncate(data.message);
      }
      if (typeof data?.error === "string" && data.error.trim()) {
        return truncate(data.error);
      }
    }

    const json = safeStringify(err);
    if (json) return truncate(json);

    return fallback;
  }

  try {
    return truncate(String(input)) || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Normalize error-ish values for JSX.
 * Preserves valid React elements; otherwise returns a safe string.
 */
export const normalizeErrorNode = (input, fallback) => {
  if (React.isValidElement(input)) return input;
  return normalizeErrorMessage(input, fallback);
};
