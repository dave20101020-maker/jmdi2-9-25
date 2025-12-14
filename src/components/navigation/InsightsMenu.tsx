import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, CalendarDays, LineChart, Share2, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const items = [
  {
    label: "Scores overview",
    to: "/analytics",
    Icon: BarChart3,
    description: "Snapshot of your pillar scores",
  },
  {
    label: "Trends",
    to: "/analytics#trends-heading",
    Icon: LineChart,
    description: "See changes over time",
  },
  {
    label: "Correlations",
    to: "/analytics#discoveries-heading",
    Icon: Share2,
    description: "Find pillar-to-pillar patterns",
  },
  {
    label: "Weekly review",
    to: "/weekly-reflection",
    Icon: CalendarDays,
    description: "Reflect and set next-week focus",
  },
] as const;

export default function InsightsMenu({ open, onClose }: Props) {
  const location = useLocation();
  const lastPathnameRef = useRef(location.pathname);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

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
    }
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
    if (shouldClose) onClose();
    else setDragY(0);
  };

  return (
    <>
      <div
        className="md:hidden fixed inset-0 z-[55] bg-black/40"
        aria-hidden
        onClick={onClose}
      />

      <div className="md:hidden fixed inset-x-0 bottom-0 z-[60]">
        <div
          className="mx-auto w-[min(520px,calc(100vw-1.5rem))] rounded-t-3xl border border-b-0 border-[var(--ns-color-border)] bg-[var(--ns-color-background)]/95 shadow-ns-card backdrop-blur"
          style={{
            transform: `translateY(${dragY}px)`,
            transition: dragging ? "none" : "transform 180ms ease-out",
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
                Insights
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/75 hover:bg-white/5"
              onClick={onClose}
              aria-label="Close insights menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-3 pb-6">
            <div className="grid grid-cols-1 gap-2">
              {items.map(({ label, to, Icon, description }) => (
                <NavLink
                  key={label}
                  to={to}
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
                      <span className="text-white">{label}</span>
                      <span className="text-[12px] font-medium text-white/55">
                        {description}
                      </span>
                    </div>
                  </div>
                  <span className="text-white/40" aria-hidden>
                    →
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
