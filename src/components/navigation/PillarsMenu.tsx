import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Brain,
  Dumbbell,
  HeartPulse,
  Home,
  Leaf,
  Moon,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { PILLARS } from "@/config/pillars";

type Props = {
  open: boolean;
  onClose: () => void;
};

const iconByPillarId: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  sleep: Moon,
  diet: Leaf,
  exercise: Dumbbell,
  physical_health: HeartPulse,
  mental_health: Brain,
  finances: Wallet,
  social: Users,
  spirituality: Sparkles,
};

const mockedBadges: Record<string, string | null> = {
  sleep: "1",
  diet: null,
  exercise: null,
  physical_health: null,
  mental_health: "•",
  finances: null,
  social: null,
  spirituality: "•",
};

export default function PillarsMenu({ open, onClose }: Props) {
  const location = useLocation();
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const lastPathnameRef = useRef(location.pathname);
  const [entered, setEntered] = useState(false);

  const pillars = useMemo(() => PILLARS.slice(0, 8), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (location.pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = location.pathname;
      onClose();
      return;
    }
    lastPathnameRef.current = location.pathname;
  }, [location.pathname, onClose, open]);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      setDragging(false);
      setTouchStartY(null);
      setEntered(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => setEntered(true), 10);
    return () => window.clearTimeout(handle);
  }, [open]);

  if (!open) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0]?.clientY ?? null);
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging || touchStartY == null) return;
    const currentY = e.touches[0]?.clientY ?? touchStartY;
    const delta = Math.max(0, currentY - touchStartY);
    setDragY(delta);
  };

  const onTouchEnd = () => {
    if (!dragging) return;
    const shouldClose = dragY > 90;
    setDragging(false);
    setTouchStartY(null);
    if (shouldClose) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  return (
    <>
      <div
        className="md:hidden fixed inset-0 z-[55] bg-black/40 transition-opacity duration-200"
        style={{ opacity: entered ? 1 : 0 }}
        aria-hidden
        onClick={onClose}
      />

      <div className="md:hidden fixed inset-x-0 bottom-0 z-[60]">
        <div
          className="mx-auto w-[min(520px,calc(100vw-1.5rem))] rounded-t-3xl border border-b-0 border-[var(--ns-color-border)] bg-[var(--ns-color-background)]/95 shadow-ns-card backdrop-blur"
          style={{
            transform: `translateY(${entered ? dragY : 24 + dragY}px)`,
            transition: dragging ? "none" : "transform 200ms ease-out",
          }}
        >
          <div
            className="flex items-center justify-between border-b border-[var(--ns-color-border)] px-4 py-3"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-10 rounded-full bg-white/20"
                aria-hidden
              />
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Pillars
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/75 hover:bg-white/5"
              onClick={onClose}
              aria-label="Close pillars menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-3 pb-6">
            <div className="grid grid-cols-1 gap-2">
              <NavLink
                to="/mission-control"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-2xl border border-[var(--ns-color-border)] px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/5"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/85"
                    aria-hidden
                  >
                    <Home className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-white">Mission Control</span>
                    <span className="text-[12px] font-medium text-white/55">
                      OS surface
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-white/40" aria-hidden>
                    →
                  </span>
                </div>
              </NavLink>

              {pillars.map((pillar) => {
                const Icon = iconByPillarId[pillar.id] || Sparkles;
                const badge = mockedBadges[pillar.id] ?? null;
                return (
                  <NavLink
                    key={pillar.id}
                    to={`/pillars/${pillar.id}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 rounded-2xl border border-[var(--ns-color-border)] px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/5"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/85"
                        aria-hidden
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-white">{pillar.label}</span>
                        <span className="text-[12px] font-medium text-white/55">
                          {pillar.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {badge && (
                        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">
                          {badge}
                        </span>
                      )}
                      <span className="text-white/40" aria-hidden>
                        →
                      </span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
