export type AiDiagnostics = {
  status?: number;
  body?: string;
  url?: string;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const looksLikeNetworkError = (name: string | undefined, message: string) => {
  const msgLower = message.toLowerCase();
  return (
    name === "TypeError" ||
    msgLower.includes("failed to fetch") ||
    msgLower.includes("networkerror") ||
    msgLower.includes("load failed") ||
    msgLower.includes("network request failed")
  );
};

const stripControlChars = (value: string) => {
  let out = "";
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    out += code < 32 || code === 127 ? " " : value[i];
  }
  return out;
};

export const normalizeAiDiagnosticsFromError = (
  error: unknown,
  url: string = "/api/ai"
): Required<Pick<AiDiagnostics, "status" | "url">> &
  Pick<AiDiagnostics, "body"> => {
  const errObj =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : null;

  const name = getString(errObj?.name);
  const message = getString(errObj?.message) || "";

  const response =
    errObj?.response && typeof errObj.response === "object"
      ? (errObj.response as Record<string, unknown>)
      : null;
  const bodyObj =
    errObj?.body && typeof errObj.body === "object"
      ? (errObj.body as Record<string, unknown>)
      : null;

  const statusCandidate =
    (errObj?.status as unknown) ??
    (response?.status as unknown) ??
    (bodyObj?.status as unknown);

  const statusFromError = isFiniteNumber(statusCandidate)
    ? statusCandidate
    : undefined;

  let status = statusFromError ?? 0;
  let body: string | undefined = message || undefined;

  if (name === "AbortError") {
    status = 0;
    body = "timeout";
  } else if (statusFromError == null && looksLikeNetworkError(name, message)) {
    status = 0;
    body = "network_error";
  }

  return {
    status,
    body,
    url,
  };
};

export const renderAiDiagnosticLabel = (d: AiDiagnostics) => {
  const status = typeof d.status === "number" ? d.status : undefined;

  if (status === 401) {
    return "AI authentication error (401) — please sign in again.";
  }
  if (status === 403) {
    return "AI access denied (403).";
  }
  if (status === 429) {
    return "AI rate limit reached (429) — please wait a moment.";
  }
  if (typeof status === "number" && status >= 500) {
    return `AI backend error (status ${status}) — try again later.`;
  }
  if (status === 0 && d.body === "timeout") {
    return "AI provider timed out.";
  }
  if (status === 0 && d.body === "network_error") {
    return "Network connection issue.";
  }

  if (typeof d.body === "string") {
    const sanitized = stripControlChars(d.body)
      .replace(/[\r\n\t]+/g, " ")
      .replace(/[<>]/g, "")
      .trim();

    if (sanitized) {
      return sanitized.length > 140 ? `${sanitized.slice(0, 140)}…` : sanitized;
    }
  }

  return "AI service unavailable.";
};
