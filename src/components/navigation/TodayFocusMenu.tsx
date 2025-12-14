import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, Target, X } from "lucide-react";
import { TODAY_FOCUS, TODAY_QUICK_ACTIONS } from "@/pages/northstar/todayFocus";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenAi: (draft?: string) => void;
};

const CRISIS_STORAGE_KEY = "ns_crisis_active";
const CRISIS_UPDATED_AT_KEY = "ns_crisis_updated_at";
const CRISIS_ACTIVE_TTL_MS = 2 * 60 * 60 * 1000;

function getCrisisModeActive() {
  try {
    const raw = localStorage.getItem(CRISIS_STORAGE_KEY);
    if (raw !== "1") return false;
    const ts = Number(localStorage.getItem(CRISIS_UPDATED_AT_KEY) || "0");
    if (!Number.isFinite(ts) || ts <= 0) return true;
    return Date.now() - ts < CRISIS_ACTIVE_TTL_MS;
  } catch {
    return false;
  }
}

export default function TodayFocusMenu({ open, onClose, onOpenAi }: Props) {
  const location = useLocation();
  const lastPathnameRef = useRef(location.pathname);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const crisisActive = useMemo(
    () => (open ? getCrisisModeActive() : false),
    [open]
  );

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
      return;
    }

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
    if (shouldClose) onClose();
    else setDragY(0);
  };

  const handleOpenAi = (draft?: string) => {
    onClose();
    onOpenAi(draft);
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
                Today
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/75 hover:bg-white/5"
              onClick={onClose}
              aria-label="Close today focus"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-3 pb-6 space-y-3">
            {crisisActive && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-white">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/15"
                    aria-hidden
                  >
                    <AlertTriangle className="h-5 w-5 text-rose-200" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Crisis mode active</p>
                    <p className="text-xs text-white/75 mt-1">
                      Use support tools now. If you need urgent help, contact
                      local emergency services.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to="/pillars/mental_health"
                        onClick={onClose}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ns-gold px-4 text-sm font-semibold text-ns-navy"
                      >
                        Open toolkit
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenAi(
                            "I need support right now. Please give me one grounding step I can do immediately."
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--ns-color-border)] px-4 text-sm font-semibold text-white/90 hover:bg-white/5"
                      >
                        Ask NorthStar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--ns-color-border)] bg-white/5 px-4 py-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    {TODAY_FOCUS.subtitle}
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {TODAY_FOCUS.title}
                  </p>
                </div>
                <Target className="h-5 w-5 text-ns-gold" aria-hidden />
              </div>

              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                {TODAY_FOCUS.whyItMatters}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/70">
                {TODAY_FOCUS.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/10 px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={TODAY_FOCUS.ctaTo}
                  onClick={onClose}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ns-gold px-4 text-sm font-semibold text-ns-navy"
                >
                  {TODAY_FOCUS.ctaLabel}
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenAi(
                      "Help me complete my most important task today. Give me the first step and a 5-minute version if I'm short on time."
                    )
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--ns-color-border)] px-4 text-sm font-semibold text-white/90 hover:bg-white/5"
                >
                  Get steps
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--ns-color-border)] bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Quick actions
              </p>
              <div className="mt-3 grid gap-2">
                {TODAY_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      if (action.id === "ai") {
                        handleOpenAi(
                          "Based on today, give me a short plan with one priority and two backups."
                        );
                        return;
                      }
                      if (action.id === "micro") {
                        handleOpenAi(
                          "Give me one quick win I can do in under 5 minutes that helps today’s focus."
                        );
                        return;
                      }
                      handleOpenAi(
                        "Re-evaluate my focus and tell me what matters most today in one sentence, then one action."
                      );
                    }}
                    className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[var(--ns-color-border)] bg-[var(--ns-color-card)]/40 px-4 py-3 text-left text-sm font-semibold text-white/90 transition hover:bg-white/5 active:scale-[0.99]"
                  >
                    <span>{action.title}</span>
                    <span className="text-[12px] font-medium text-white/60">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
