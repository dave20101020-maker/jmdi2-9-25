import React from "react";
import { useFocusTrap } from "./useFocusTrap";

const DEFAULT_HABITS = [
  { id: "hydrate", label: "Hydrate (one glass of water)" },
  { id: "move", label: "Move (5–10 minutes)" },
  { id: "protein", label: "Protein-forward meal" },
  { id: "winddown", label: "Evening wind-down (no screens)" },
];

export default function MissionControlActionOverlay({ registerApi }) {
  const [activeActionId, setActiveActionId] = React.useState(null);
  const [habitChecks, setHabitChecks] = React.useState(() => ({}));
  const [isVisible, setIsVisible] = React.useState(false);
  const panelRef = React.useRef(null);
  const lastActiveElementRef = React.useRef(null);

  useFocusTrap(panelRef, Boolean(activeActionId));

  React.useEffect(() => {
    if (typeof registerApi !== "function") return;

    registerApi({
      open: (actionId) => {
        lastActiveElementRef.current = document.activeElement;
        setActiveActionId(actionId);
      },
      close: () => setActiveActionId(null),
    });
  }, [registerApi]);

  React.useEffect(() => {
    if (activeActionId === "LOG_HABIT") {
      setHabitChecks({});
    }
  }, [activeActionId]);

  React.useEffect(() => {
    if (!activeActionId) {
      setIsVisible(false);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => setIsVisible(true), 10);

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        setActiveActionId(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);

      const el = lastActiveElementRef.current;
      if (el && typeof el.focus === "function") {
        // Restore focus to the invoking element.
        el.focus();
      }
    };
  }, [activeActionId]);

  if (!activeActionId) return null;

  const isCoach = activeActionId === "ASK_AI_COACH";
  const isHabit = activeActionId === "LOG_HABIT";

  const title = isCoach
    ? "AI coach (placeholder)"
    : isHabit
    ? "Log a habit (placeholder)"
    : "";

  const close = () => setActiveActionId(null);

  const titleId = "mc-action-overlay-title";

  return (
    <div className="fixed inset-0 z-50" aria-hidden={false}>
      <button
        type="button"
        aria-label="Close"
        className={
          "absolute inset-0 bg-black/60 transition-opacity duration-200 ease-out motion-reduce:transition-none " +
          (isVisible ? "opacity-100" : "opacity-0")
        }
        onClick={close}
      />

      <div className="absolute inset-x-0 bottom-0">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={
            "mx-auto max-w-2xl rounded-t-2xl bg-white/10 border border-white/20 backdrop-blur-lg p-5 text-white " +
            "transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none " +
            (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Mission Control
              </p>
              <h2 id={titleId} className="text-xl font-bold mt-2">
                {title}
              </h2>
            </div>
            <button
              type="button"
              className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-sm"
              onClick={close}
            >
              Close
            </button>
          </div>

          {isCoach && (
            <div className="mt-4 space-y-3 text-white/80">
              <p>
                This is a local placeholder. If it feels manageable, you could
                take one small step and return here later.
              </p>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-white/70">
                  Coming next (read-only):
                  <br />
                  • Todays guidance
                  <br />
                  • 3-step plan
                  <br />• Pillar-specific coaching
                </p>
              </div>
            </div>
          )}

          {isHabit && (
            <div className="mt-4">
              <p className="text-sm text-white/70">
                Pick a quick check-in. Nothing is saved (by design).
              </p>

              <div className="mt-3 space-y-2">
                {DEFAULT_HABITS.map((habit) => (
                  <label
                    key={habit.id}
                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(habitChecks[habit.id])}
                      onChange={(e) =>
                        setHabitChecks((prev) => ({
                          ...prev,
                          [habit.id]: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm text-white">{habit.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm"
                  onClick={close}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
