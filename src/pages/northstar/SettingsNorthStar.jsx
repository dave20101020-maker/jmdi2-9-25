import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  Lock,
  LogOut,
  RefreshCcw,
  Server,
  Sparkles,
} from "lucide-react";
import { themeTokens } from "@/components/ThemeProvider";

export default function SettingsNorthStar() {
  const [theme, setTheme] = useState("system");
  const [persona, setPersona] = useState("Supportive Guide");
  const [tone, setTone] = useState("warm");
  const [syncStatus] = useState("Healthy");
  const [twofaStatus, setTwofaStatus] = useState("Disabled");
  const [sessionStatus, setSessionStatus] = useState("Not reviewed");
  const [resetStatus, setResetStatus] = useState("Active");
  const [syncMessage, setSyncMessage] = useState("Idle");
  const [exportMessage, setExportMessage] = useState("Not requested");
  const [logoutMessage, setLogoutMessage] = useState("");
  const offlineQueue = [
    { id: 1, type: "Check-in", status: "Pending" },
    { id: 2, type: "Workout", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          Settings
        </p>
        <h1 className="text-3xl font-semibold text-white">Control center</h1>
        <p className="text-sm text-white/70">
          Account security, AI persona, sync, and exports.
        </p>
      </header>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Account security</h2>
          <Lock className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">Two-factor authentication</p>
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => setTwofaStatus("Enabled (mock)")}
            >
              Enable 2FA
            </button>
            <p className="text-xs text-white/60">Status: {twofaStatus}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">Active sessions</p>
            <button
              className={themeTokens.buttonGhost}
              onClick={() => setSessionStatus("Reviewed (mock)")}
            >
              Review sessions
            </button>
            <p className="text-xs text-white/60">{sessionStatus}</p>
          </div>
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Theme & appearance
          </h2>
          <Sparkles className="h-5 w-5 text-amber-300" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">Theme</p>
            <select
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">AI persona</p>
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
            />
            <select
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="warm">Warm</option>
              <option value="neutral">Neutral</option>
              <option value="direct">Direct</option>
            </select>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">Reset profile</p>
            <button
              className={themeTokens.buttonGhost}
              onClick={() => setResetStatus("Local data reset (mock)")}
            >
              Reset (mock)
            </button>
            <p className="text-[11px] text-white/60">{resetStatus}</p>
            <p className="text-[11px] text-white/60">Clears local data only.</p>
          </div>
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Data sync</h2>
          <Server className="h-5 w-5 text-cyan-300" />
        </div>
        <p className="text-sm text-white/70">Status: {syncStatus}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">Offline sync queue</p>
            <ul className="space-y-1 text-xs text-white/70">
              {offlineQueue.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.type}</span>
                  <span>{item.status}</span>
                </li>
              ))}
            </ul>
            <button
              className={themeTokens.buttonGhost}
              onClick={() => setSyncMessage("Retried sync (mock)")}
            >
              <RefreshCcw className="mr-2 inline h-4 w-4" /> Retry sync
            </button>
            <p className="text-xs text-white/60">{syncMessage || "Pending"}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm text-white">Data export</p>
            <div className="flex gap-2">
              <button
                className={themeTokens.buttonPrimary}
                onClick={() => setExportMessage("CSV generated (mock)")}
              >
                <Download className="mr-2 inline h-4 w-4" /> CSV
              </button>
              <button
                className={themeTokens.buttonGhost}
                onClick={() => setExportMessage("JSON generated (mock)")}
              >
                JSON
              </button>
            </div>
            <div className="text-xs text-white/60">{exportMessage}</div>
          </div>
        </div>
      </section>

      <section className={`${themeTokens.card} p-4 space-y-3`}>
        <h2 className="text-lg font-semibold text-white">Legal & compliance</h2>
        <div className="flex flex-wrap gap-3 text-sm text-ns-gold">
          <Link to="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link to="/terms" className="hover:underline">
            Terms
          </Link>
          <Link to="/trust-center" className="hover:underline">
            Trust Center
          </Link>
        </div>
        <button
          className={`${themeTokens.buttonGhost} text-red-300 border border-red-500/40 bg-red-500/10`}
          onClick={() => setLogoutMessage("Logged out (mock)")}
        >
          <LogOut className="mr-2 inline h-4 w-4" /> Logout
        </button>
        <p className="text-xs text-white/60">{logoutMessage}</p>
      </section>

      <div
        className={`${themeTokens.panel} p-3 text-xs text-amber-200 flex items-start gap-2`}
      >
        <AlertTriangle className="h-4 w-4 mt-0.5" />
        <p>
          All settings are UI-only mocks; they demonstrate the required surface
          for security, AI, sync, and exports.
        </p>
      </div>
    </div>
  );
}
