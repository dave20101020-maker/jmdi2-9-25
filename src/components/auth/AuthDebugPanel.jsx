import { useAuth } from "@/hooks/useAuth";

const readStorageSnapshot = () => {
  if (typeof window === "undefined") {
    return {
      token: null,
      jwt: null,
      persistedUserStore: null,
    };
  }

  return {
    token: localStorage.getItem("token"),
    jwt: localStorage.getItem("jwt"),
    persistedUserStore: localStorage.getItem("northstar-user-storage"),
  };
};

export default function AuthDebugPanel() {
  const {
    user,
    isAuthenticated,
    initializing,
    loading,
    error,
    authMechanism,
    lastAuthCheck,
  } = useAuth();

  const storage = readStorageSnapshot();

  if (!import.meta.env.DEV) return null;

  const userId = user?._id || user?.id || user?.email || null;
  const lastError = error?.message || error?.body?.error || null;

  return (
    <div className="text-xs text-white/80 p-3">
      <div className="ns-alert" role="status" aria-live="polite">
        <div className="font-semibold">Auth Debug</div>
        <div>authMechanism: {authMechanism || "unknown"}</div>
        <div>isAuthenticated: {String(Boolean(isAuthenticated))}</div>
        <div>initializing: {String(Boolean(initializing))}</div>
        <div>loading: {String(Boolean(loading))}</div>
        <div>user: {userId || "(none)"}</div>
        <div>
          token/localStorage: {storage.token ? "present" : "absent"} | jwt:
          {storage.jwt ? "present" : "absent"}
        </div>
        <div>
          persistedUserStore(northstar-user-storage):
          {storage.persistedUserStore ? "present" : "absent"}
        </div>
        <div>
          lastAuthCheck: {lastAuthCheck?.status || "unknown"}
          {lastAuthCheck?.at ? ` @ ${lastAuthCheck.at}` : ""}
        </div>
        <div>lastAuthError: {lastError || "(none)"}</div>
        <div>
          session(cookie): httpOnly (not readable); verified via /api/auth/me
        </div>
      </div>
    </div>
  );
}
