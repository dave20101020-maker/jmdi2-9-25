const mapErrorMessage = (status, raw) => {
  if (status === 401 || status === 403) return "AI key invalid";
  if (status === 429) return "Rate limited, try again in a minute";
  if (status === 408) return "AI provider timed out";
  if (!status || status === 0) return "We couldn’t reach the AI service";
  return raw || "AI temporarily unavailable";
};

export const sendNorthStarMessage = async ({ message }) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message is required for NorthStar AI chat");
  }

  try {
    const payload = { prompt: message };
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

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
        diagnostics: {
          status,
          body: text,
          url: "/api/ai",
        },
      };
    }

    const reply = data?.reply || data?.response || data?.text;

    return {
      ok: true,
      response: reply,
      provider: data?.provider,
      diagnostics: {
        status: res.status,
        body: text,
        url: "/api/ai",
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
        url: "/api/ai",
      },
    };
  }
};
