import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { api } from "@/utils/apiClient";
import { toast } from "sonner";
import { AUTH_MODE } from "@/config/authMode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HealthIntegrations from "@/components/HealthIntegrations";
import { AppSettingsContext } from "@/context/AppSettingsContext.jsx";
import DiagnosticsPanel from "./Settings/DiagnosticsPanel";
import { NAMED_ROUTES } from "@/config/routes";
import { getAIMemorySummary, resetAIMemory } from "@/api/aiMemoryClient";
import { getUserConsent, updateUserConsent } from "@/api/userConsentClient";
import { emitAuditEvent } from "@/api/auditClient";

export default function Settings() {
  const { settings, setSetting } = useContext(AppSettingsContext);
  const [activeTab, setActiveTab] = useState("integrations");
  const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion);
  const [theme, setTheme] = useState(settings.theme);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [persona, setPersona] = useState(
    settings.aiCoach?.persona || "Supportive Guide"
  );
  const [tone, setTone] = useState(settings.aiCoach?.tone || "warm");
  const [model, setModel] = useState(settings.aiCoach?.model || "default");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [memorySummary, setMemorySummary] = useState("");
  const [memorySummaryError, setMemorySummaryError] = useState("");
  const [aiMemoryConsent, setAiMemoryConsent] = useState(null);
  const [consentError, setConsentError] = useState("");
  const [memoryResetError, setMemoryResetError] = useState("");
  const [authForm, setAuthForm] = useState({
    currentPassword: "",
    newPassword: "",
    newEmail: "",
  });

  useEffect(() => {
    setSetting("reduceMotion", reduceMotion);
  }, [reduceMotion, setSetting]);
  useEffect(() => {
    setSetting("theme", theme);
  }, [theme, setSetting]);
  useEffect(() => {
    setSetting("notifications", notifications);
  }, [notifications, setSetting]);
  useEffect(() => {
    setSetting("aiCoach", { persona, tone, model });
  }, [persona, tone, model, setSetting]);

  useEffect(() => {
    let active = true;

    const loadMemorySummary = async () => {
      const result = await getAIMemorySummary();
      if (!active) return;

      if (!result.ok || !result.data?.ok) {
        setMemorySummaryError("Memory summary unavailable right now.");
        return;
      }

      const conversationCount = result.data.conversationCount ?? 0;
      const pillarCount = Object.keys(result.data.pillars || {}).length;
      const summaryText = `Stored conversations: ${conversationCount} across ${pillarCount} pillar${
        pillarCount === 1 ? "" : "s"
      }.`;
      setMemorySummary(summaryText);

      emitAuditEvent({
        eventType: "ai_memory.summary.read",
        payload: { conversationCount, pillarCount },
        metadata: { source: "settings.ai" },
      });
    };

    const loadConsent = async () => {
      const result = await getUserConsent();
      if (!active) return;

      if (!result.ok || !result.data?.success) {
        setConsentError("Consent status unavailable right now.");
        return;
      }

      setAiMemoryConsent(Boolean(result.data?.data?.aiConsent));
    };

    loadMemorySummary().catch(() => {
      if (active)
        setMemorySummaryError("Memory summary unavailable right now.");
    });
    loadConsent().catch(() => {
      if (active) setConsentError("Consent status unavailable right now.");
    });

    return () => {
      active = false;
    };
  }, []);

  const handleConsentToggle = async () => {
    if (aiMemoryConsent === null) return;

    const nextValue = !aiMemoryConsent;
    setAiMemoryConsent(nextValue);
    setConsentError("");

    const result = await updateUserConsent({ aiConsent: nextValue });
    if (!result.ok || !result.data?.success) {
      setAiMemoryConsent(!nextValue);
      setConsentError("Unable to update consent right now.");
      return;
    }

    emitAuditEvent({
      eventType: "ai_memory.consent.update",
      payload: { aiConsent: nextValue },
      metadata: { source: "settings.ai" },
    });
  };

  const handleMemoryReset = async () => {
    setMemoryResetError("");
    const confirmed = window.confirm("Reset AI memory? This cannot be undone.");
    if (!confirmed) return;

    const result = await resetAIMemory();
    if (!result.ok || !result.data?.ok) {
      setMemoryResetError("Unable to reset memory right now.");
      return;
    }

    emitAuditEvent({
      eventType: "ai_memory.reset",
      payload: { message: result.data?.message || "reset" },
      metadata: { source: "settings.ai" },
    });

    setMemorySummary("Stored conversations: 0 across 0 pillars.");
  };

  const handleChangePassword = async () => {
    if (!authForm.newPassword || !authForm.currentPassword) {
      toast.error("Enter current and new password");
      return;
    }
    setChangingPassword(true);
    try {
      // TODO: replace with real change-password endpoint when available
      await api.authUpdateMe({ password: authForm.newPassword });
      toast.success("Password updated (stub)");
      setAuthForm((v) => ({ ...v, currentPassword: "", newPassword: "" }));
    } catch (err) {
      console.error("change password", err);
      toast.error("Unable to change password yet (stub)");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!authForm.newEmail) {
      toast.error("Enter a new email");
      return;
    }
    setChangingEmail(true);
    try {
      // TODO: replace with real change-email endpoint when available
      await api.authUpdateMe({ email: authForm.newEmail });
      toast.success("Email updated (stub)");
      setAuthForm((v) => ({ ...v, newEmail: "" }));
    } catch (err) {
      console.error("change email", err);
      toast.error("Unable to change email yet (stub)");
    } finally {
      setChangingEmail(false);
    }
  };

  const handleLogout = async () => {
    if (AUTH_MODE === "PARKED") {
      toast.message("Auth is parked — logout disabled");
      return;
    }
    try {
      await api.logout();
      window.location.href = "/sign-in";
    } catch (err) {
      console.error("logout", err);
      toast.error("Logout failed. Try again.");
    }
  };

  const handleDataExport = async () => {
    try {
      // TODO: wire to real export endpoint. For now, mock a JSON blob.
      const mock = {
        status: "export_pending",
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(mock, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "northstar-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data export generated (stub)");
    } catch (err) {
      console.error("export", err);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-white/60">
          Manage your account preferences and integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="integrations">Health Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="ai">AI Coach</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <HealthIntegrations />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Account Settings</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Change password
                  </p>
                  <p className="text-xs text-white/60">
                    Updates your password. Stubbed until backend endpoint is
                    ready.
                  </p>
                </div>
                <input
                  type="password"
                  className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm"
                  placeholder="Current password"
                  value={authForm.currentPassword}
                  onChange={(e) =>
                    setAuthForm((v) => ({
                      ...v,
                      currentPassword: e.target.value,
                    }))
                  }
                />
                <input
                  type="password"
                  className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm"
                  placeholder="New password"
                  value={authForm.newPassword}
                  onChange={(e) =>
                    setAuthForm((v) => ({ ...v, newPassword: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-ns-gold px-3 py-2 text-sm font-semibold text-ns-navy hover:brightness-95 disabled:opacity-60"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? "Updating..." : "Update password"}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Change email
                  </p>
                  <p className="text-xs text-white/60">
                    Send verification to your new email. Stubbed until backend
                    endpoint is ready.
                  </p>
                </div>
                <input
                  type="email"
                  className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm"
                  placeholder="New email"
                  value={authForm.newEmail}
                  onChange={(e) =>
                    setAuthForm((v) => ({ ...v, newEmail: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
                  onClick={handleChangeEmail}
                  disabled={changingEmail}
                >
                  {changingEmail ? "Updating..." : "Update email"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Logout</p>
                <p className="text-xs text-white/60">
                  End your session on this device.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-white">Data export</p>
                <p className="text-xs text-white/60">
                  Download a JSON export of your data. Stubbed for now.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
                  onClick={handleDataExport}
                >
                  Download JSON
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-white">Sync status</p>
                <p className="text-xs text-white/60">
                  View offline queue and pending sync items.
                </p>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                  {/* TODO: wire to offline queue store */}
                  <p>Offline queue: 0 items</p>
                  <p>Last sync: just now</p>
                </div>
              </div>

              <div className="rounded-2xl border border-red-900/40 bg-red-900/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-red-100">
                  Dangerous reset
                </p>
                <p className="text-xs text-red-100/80">
                  Reset cached data and queues on this device. Action is local
                  and cannot be undone.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  Reset device cache
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Preferences</h2>
            <div className="flex items-center justify-between bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
              <div>
                <div className="text-sm font-medium">Reduced Motion</div>
                <div className="text-xs text-white/60">
                  Minimize animations for comfort and battery life.
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-white/10 text-sm text-white hover:bg-white/15"
                aria-pressed={reduceMotion}
                onClick={() => setReduceMotion((v) => !v)}
              >
                {reduceMotion ? "On" : "Off"}
              </button>
            </div>
            <div className="flex items-center justify-between bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
              <div>
                <div className="text-sm font-medium">Theme</div>
                <div className="text-xs text-white/60">
                  Choose light, dark, or follow system.
                </div>
              </div>
              <select
                className="bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center justify-between bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
              <div>
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-white/60">
                  Enable in-app notifications.
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-white/10 text-sm text-white hover:bg-white/15"
                aria-pressed={notifications}
                onClick={() => setNotifications((v) => !v)}
              >
                {notifications ? "On" : "Off"}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">AI Coach Settings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
                <div className="text-sm font-medium mb-2">Persona</div>
                <input
                  type="text"
                  className="w-full bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="e.g., Supportive Guide"
                />
              </div>
              <div className="bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4">
                <div className="text-sm font-medium mb-2">Tone</div>
                <select
                  className="w-full bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="warm">Warm</option>
                  <option value="neutral">Neutral</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              <div className="bg-white/5 dark:bg-white/10 border border-white/10 rounded-2xl p-4 md:col-span-2">
                <div className="text-sm font-medium mb-2">Model</div>
                <select
                  className="w-full bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="fast">Fast (cheaper)</option>
                  <option value="accurate">Accurate (slower)</option>
                </select>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">AI Memory</p>
                <p className="text-xs text-white/60">
                  Review what NorthStar remembers and reset when needed.
                </p>
              </div>
              <div className="text-sm text-white/80">
                {memorySummaryError ? memorySummaryError : memorySummary}
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                <div>
                  <div className="text-sm font-medium">Memory usage</div>
                  <div className="text-xs text-white/60">
                    Allow AI to use saved context.
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 rounded-full bg-white/10 text-sm text-white hover:bg-white/15 disabled:opacity-60"
                  aria-pressed={Boolean(aiMemoryConsent)}
                  onClick={handleConsentToggle}
                  disabled={aiMemoryConsent === null}
                >
                  {aiMemoryConsent ? "On" : "Off"}
                </button>
              </div>
              {consentError && (
                <p className="text-xs text-white/60">{consentError}</p>
              )}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
                  onClick={handleMemoryReset}
                >
                  Reset AI memory
                </button>
                {memoryResetError && (
                  <span className="text-xs text-white/60">
                    {memoryResetError}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics" className="mt-6">
          <DiagnosticsPanel />
        </TabsContent>
      </Tabs>

      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-red-950/70 p-5 text-red-50 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Reset device cache?</h3>
            <p className="text-sm text-red-100/90 mb-4">
              This clears local cached data and offline queues on this device
              only. You will remain signed in. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/10"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-500/80 px-3 py-2 text-sm font-semibold text-red-50 hover:bg-red-500"
                onClick={() => {
                  // TODO: clear offline queues/storage when implemented
                  toast.success("Local cache cleared (stub)");
                  setResetConfirmOpen(false);
                }}
              >
                Confirm reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-ns-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">
            Trust Center
          </p>
          <h2 className="text-lg font-semibold text-white">
            DPIA, LLM safety disclosures, and controls
          </h2>
          <p className="text-white/70 text-sm">
            Review how NorthStar handles data, safety guardrails, and compliance
            commitments.
          </p>
        </div>
        <Link
          to={NAMED_ROUTES.TrustCenter}
          className="inline-flex items-center justify-center rounded-full bg-ns-gold px-4 py-2 text-sm font-semibold text-ns-navy hover:bg-ns-softGold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ns-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ns-navy"
        >
          Open Trust Center
        </Link>
      </div>
    </div>
  );
}
