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

export const emitAuditEvent = async (event = {}) => {
  const response = await _safeFetch("/api/audit/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  if (!response?.ok) {
    return {
      ok: false,
      error: response?.error || response?.status || "audit_event_failed",
    };
  }

  const data = await _safeJson(response);
  return { ok: true, data };
};

export const getRoutingEvents = async (limit = 8) => {
  const response = await _safeFetch(`/api/audit/routing?limit=${limit}`, {
    method: "GET",
  });

  if (!response?.ok) {
    return {
      ok: false,
      error: response?.error || response?.status || "audit_event_failed",
    };
  }

  const data = await _safeJson(response);
  return { ok: true, data };
};
