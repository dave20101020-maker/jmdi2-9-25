const _safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const _safeFetch = async (url, options = {}) => {
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

export const getUserConsent = async () => {
  const response = await _safeFetch("/api/user/consent", {
    method: "GET",
  });

  if (!response?.ok) {
    return {
      ok: false,
      error: response?.error || response?.status || "consent_fetch_failed",
    };
  }

  const data = await _safeJson(response);
  return { ok: true, data };
};

export const updateUserConsent = async (payload = {}) => {
  const response = await _safeFetch("/api/user/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response?.ok) {
    return {
      ok: false,
      error: response?.error || response?.status || "consent_update_failed",
    };
  }

  const data = await _safeJson(response);
  return { ok: true, data };
};
