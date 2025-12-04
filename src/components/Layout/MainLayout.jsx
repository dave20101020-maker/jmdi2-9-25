import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { PILLARS } from "@/config/pillars";
import NSButton from "@/components/ui/NSButton";
import "@/App.css";

const NAV_LINKS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Onboarding", to: "/onboarding" },
  { label: "Pricing", to: "/pricing" },
  { label: "Settings", to: "/settings" },
];

const FALLBACK_PILLAR_COLORS = {
  sleep: "#5B5FEF",
  diet: "#4CD97B",
  exercise: "#FF6B6B",
  physical_health: "#FF92B2",
  mental_health: "#4CC9F0",
  finances: "#2DD4BF",
  social: "#FACC15",
  spirituality: "#C77DFF",
};

export default function MainLayout() {
  return (
    <div className="ns-shell">
      <aside className="ns-sidebar">
        <div>
          <p className="ns-sidebar__logo">NORTHSTAR</p>
          <h2 className="text-2xl font-semibold text-white mt-2">
            Command Center
          </h2>
        </div>
        <nav className="ns-sidebar__list" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                ["ns-sidebar__link", isActive ? "active" : ""].join(" ")
              }
            >
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ns-pill-list" aria-label="Life pillars">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-1">
            Pillars
          </p>
          {PILLARS.map((pillar) => (
            <Link
              key={pillar.id}
              to={`/pillar/${pillar.id}`}
              className="ns-pill"
            >
              <div className="flex items-center gap-2">
                <span
                  className="ns-pill__chip"
                  style={{
                    background: FALLBACK_PILLAR_COLORS[pillar.id] || "#f4d06f",
                  }}
                />
                <span className="text-sm text-white/80">{pillar.label}</span>
              </div>
              <span className="text-white/30 text-xs">↗</span>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-sm text-white/60 mb-3">Need to switch accounts?</p>
          <NSButton asChild size="sm" variant="outline" fullWidth>
            <Link to="/sign-in">Sign in</Link>
          </NSButton>
        </div>
      </aside>

      <div className="ns-content">
        <header className="ns-topbar">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-1">
              Mission
            </p>
            <p className="text-white font-semibold">Design System · Base44</p>
          </div>
          <div className="flex gap-3">
            <NSButton asChild variant="ghost" size="sm">
              <Link to="/sign-in">Login</Link>
            </NSButton>
            <NSButton asChild size="sm">
              <Link to="/sign-up">Get Started</Link>
            </NSButton>
          </div>
        </header>

        <main className="ns-main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
