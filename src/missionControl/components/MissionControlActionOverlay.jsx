import React from "react";

const DEFAULT_HABITS = [
  { id: "hydrate", label: "Hydrate (one glass of water)" },
  { id: "move", label: "Move (5–10 minutes)" },
  { id: "protein", label: "Protein-forward meal" },
  { id: "winddown", label: "Evening wind-down (no screens)" },
];

export default function MissionControlActionOverlay({ registerApi }) {
  const [activeActionId, setActiveActionId] = React.useState(null);
  const [habitChecks, setHabitChecks] = React.useState(() => ({}));

  React.useEffect(() => {
    if (typeof registerApi !== "function") return;

    registerApi({
      open: (actionId) => setActiveActionId(actionId),
      close: () => setActiveActionId(null),
    });
  }, [registerApi]);

  React.useEffect(() => {
    if (activeActionId === "LOG_HABIT") {
      setHabitChecks({});
    }
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

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={close}
      />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-2xl rounded-t-2xl bg-white/10 border border-white/20 backdrop-blur-lg p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Mission Control
              </p>
              <h2 className="text-xl font-bold mt-2">{title}</h2>
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
                This is a local placeholder. Phase 3 will connect this to the AI
                coach.
              </p>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-white/70">
                  Coming next:
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
