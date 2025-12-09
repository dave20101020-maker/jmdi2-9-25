import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { themeTokens } from "../ThemeProvider";
import { PILLARS } from "@/config/pillars";

const primaryLinks = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Habits", path: "/habits" },
  { label: "Check-ins", path: "/check-ins" },
  { label: "Pricing", path: "/pricing" },
];

const authLinks = [
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" },
  { label: "Onboarding", path: "/onboarding" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center justify-between rounded-full px-4 py-2 text-sm font-semibold transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-color-ring)]",
    isActive
      ? "bg-white/10 text-white shadow-ns-card"
      : "text-white/75 hover:bg-white/5",
  ].join(" ");

export default function AppShell() {
  return (
    <div className={`flex min-h-screen ${themeTokens.surface}`}>
      <aside
        className="hidden lg:flex w-72 flex-col gap-6 border-r border-[var(--ns-color-border)] bg-[var(--ns-color-background)]/80 px-6 py-8 backdrop-blur"
        aria-label="Primary navigation"
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            NorthStar
          </p>
          <h1 className="text-2xl font-semibold text-white">Mission Control</h1>
          <p className="text-sm text-white/60">
            Navigate pillars and routines with a clear Navy & Gold visual
            hierarchy.
          </p>
        </div>

        <nav className="space-y-2" aria-label="Core destinations">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={navLinkClass}
              end
            >
              <span>{link.label}</span>
              <span aria-hidden className="text-white/50">
                ↗
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Pillars
          </p>
          <div className="space-y-2">
            {PILLARS.map((pillar) => (
              <NavLink
                key={pillar.id}
                to={`/pillars/${pillar.id}`}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl border border-[var(--ns-color-border)] px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white shadow-ns-card"
                      : "text-white/75 hover:bg-white/5"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ns-gold/15 text-xs font-semibold text-ns-gold"
                    aria-hidden
                  >
                    {pillar.score || "∞"}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">
                      {pillar.label}
                    </span>
                    <span className="text-[13px] text-white/60">
                      Insights & nudges
                    </span>
                  </div>
                </div>
                <span aria-hidden className="text-white/40">
                  →
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3 rounded-2xl border border-[var(--ns-color-border)] bg-[var(--ns-color-card)]/70 p-4 text-white shadow-ns-card">
          <p className="text-sm font-semibold">Stay aligned</p>
          <p className="text-sm text-white/70">
            Keep your habits and check-ins flowing—Gold accents highlight
            actions with the strongest contrast against the Navy base.
          </p>
          <div className="flex gap-2">
            <NavLink to="/onboarding" className={themeTokens.buttonGhost}>
              Onboarding
            </NavLink>
            <NavLink to="/pricing" className={themeTokens.buttonPrimary}>
              Upgrade
            </NavLink>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--ns-color-border)] bg-[var(--ns-color-background)]/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                NorthStar
              </p>
              <p className="text-lg font-semibold text-white">
                Pillar System Shell
              </p>
            </div>
            <nav className="flex items-center gap-2" aria-label="Account">
              {authLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={navLinkClass}
                  end
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-5 py-8">
            <div className={`${themeTokens.panel} mb-6 p-4`}>
              Navy + Gold AppShell ready for routed content.
            </div>
            <div className={themeTokens.card}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
