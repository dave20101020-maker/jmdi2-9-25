import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { PILLARS } from "@/config/pillars";
import NSButton from "@/components/ui/NSButton";
import { cn } from "@/utils";
import "@/App.css";
import NorthStarAssistant from "@/ai/NorthStarAssistant";

const ROUTES = Object.freeze({
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  pricing: "/pricing",
  settings: "/settings",
  signIn: "/sign-in",
  signUp: "/sign-up",
});

const PRIMARY_NAV = [
  { label: "Dashboard", path: ROUTES.dashboard },
  { label: "Onboarding", path: ROUTES.onboarding },
  { label: "Pricing", path: ROUTES.pricing },
  { label: "Settings", path: ROUTES.settings },
];

const normalizePath = (value) => {
  if (!value) return "/";
  if (value === "/") return "/";
  const trimmed = value.replace(/\/+$/, "");
  return trimmed || "/";
};

export default function MainLayout() {
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);
  const DEMO_MODE =
    (import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true" ||
    import.meta.env.VITE_DISABLE_PROTECTION === "true";

  const isRouteActive = (path, { exact } = {}) => {
    const normalized = normalizePath(path);
    if (exact) {
      return currentPath === normalized;
    }
    return (
      currentPath === normalized || currentPath.startsWith(`${normalized}/`)
    );
  };

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
          {PRIMARY_NAV.map((link) => {
            const active = isRouteActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn("ns-sidebar__link", active && "active")}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
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
              data-pillar={pillar.id}
            >
              <div className="flex items-center gap-2">
                <span className="ns-pill__chip" aria-hidden="true" />
                <span className="text-sm text-white/80">{pillar.label}</span>
              </div>
              <span className="text-white/30 text-xs">↗</span>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-sm text-white/60 mb-3">Need to switch accounts?</p>
          <NSButton
            asChild
            size="md"
            variant="outline"
            fullWidth
            className="ns-topnav__link"
            aria-current={
              isRouteActive(ROUTES.signIn, { exact: true }) ? "page" : undefined
            }
          >
            <Link to={ROUTES.signIn}>Sign in</Link>
          </NSButton>
        </div>
      </aside>

      <div className="ns-content">
        <header className="ns-topbar">
          {DEMO_MODE && (
            <div className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center px-3 py-2 bg-yellow-500/10 border-b border-yellow-400/30 backdrop-blur-md">
              <p className="text-xs sm:text-sm text-yellow-300 font-medium tracking-wide">
                Demo Mode Active — authentication is temporarily disabled for
                navigation. Remember to turn it off before launch.
              </p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-1">
              Mission
            </p>
            <p className="text-white font-semibold">
              Mission Control · NorthStar
            </p>
          </div>
          <div className="flex gap-3">
            <NSButton
              asChild
              variant="ghost"
              size="sm"
              className="ns-topnav__link"
              aria-current={
                isRouteActive(ROUTES.signIn, { exact: true })
                  ? "page"
                  : undefined
              }
            >
              <Link to={ROUTES.signIn}>Login</Link>
            </NSButton>
            <NSButton
              asChild
              size="sm"
              variant="primary"
              className="ns-topnav__link"
              aria-current={
                isRouteActive(ROUTES.signUp, { exact: true })
                  ? "page"
                  : undefined
              }
            >
              <Link to={ROUTES.signUp}>Get Started</Link>
            </NSButton>
          </div>
        </header>

        <main className="ns-main-panel">
          <Outlet />
        </main>
      </div>
      <NorthStarAssistant />
    </div>
  );
}
