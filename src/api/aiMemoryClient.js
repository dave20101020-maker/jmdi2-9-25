const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });
    return response;
  } catch (error) {
    return { ok: false, error };
  }
};

export const getAIMemorySummary = async () => {
  const response = await safeFetch("/api/ai/unified/memory", {
    method: "GET",
  });

  if (!response?.ok) {
    return {
      ok: false,
      error: response?.error || response?.status || "memory_summary_failed",
    };
  }

  const data = await safeJson(response);
  return { ok: true, data };
};

export const resetAIMemory = async () => {
  const response = await safeFetch("/api/ai/unified/memory/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response?.ok) {
    return {
      ok: false,
      error: response?.error || response?.status || "memory_reset_failed",
    };
  }

  const data = await safeJson(response);
  return { ok: true, data };
};
