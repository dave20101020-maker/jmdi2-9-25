const mapErrorMessage = (status, raw) => {
  if (status === 401 || status === 403) return "Sign in required to use AI";
  if (status === 429) return "Rate limited, try again in a minute";
  if (status === 408) return "AI provider timed out";
  if (!status || status === 0) return "AI service temporarily unavailable";
  return raw || "AI temporarily unavailable";
};

/**
 * Frontend-only AI chat helper.
 *
 * IMPORTANT:
 * - Does not change backend routes or schemas.
 * - Uses the existing unified chat endpoint so we can pass pillar/module context.
 */
export const sendNorthStarMessage = async ({
  message,
  pillar,
  module,
  explicitMode,
  context,
} = {}) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message is required for NorthStar AI chat");
  }

  try {
    // Prefer the unified orchestrator which already supports pillar/module/options.
    // We keep the return shape compatible with existing callers.
    const payload = {
      message,
      pillar,
      module,
      // Explicit mode is a legacy concept; preserve it as metadata only.
      options: {
        explicitMode: Boolean(explicitMode),
        uiContext: context,
      },
    };

    const res = await fetch("/api/ai/unified/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const requestId = res?.headers?.get?.("x-ns-request-id") || null;
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const status = res.status;
      const message = mapErrorMessage(status, data?.error || data?.message);
      return {
        ok: false,
        error: true,
        status,
        message,
        requestId,
        diagnostics: {
          status,
          body: text,
          url: "/api/ai/unified/chat",
        },
      };
    }

    const reply = data?.reply || data?.response || data?.text;

    return {
      ok: data?.ok ?? true,
      response: reply,
      text: data?.text,
      pillar: data?.pillar,
      module: data?.module,
      provider: data?.provider,
      requestId,
      diagnostics: {
        status: res.status,
        body: text,
        url: "/api/ai/unified/chat",
      },
    };
  } catch (error) {
    console.error("NorthStar AI request failed", error);
    const status = error?.status || 0;
    const message = mapErrorMessage(status, error?.message);
    return {
      ok: false,
      error: true,
      status,
      message,
      diagnostics: {
        status,
        body: error?.body || error?.message,
        url: "/api/ai/unified/chat",
      },
    };
  }
};
