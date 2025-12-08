import React, { useEffect, useState } from "react";

export default function ReduceMotionToggle({ onChange }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("app.reduceMotion") === "true";
    setEnabled(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("app.reduceMotion", String(enabled));
    onChange?.(enabled);
  }, [enabled, onChange]);

  return (
    <button
      type="button"
      className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/15"
      onClick={() => setEnabled((v) => !v)}
      aria-pressed={enabled}
      aria-label={enabled ? "Enable animations" : "Reduce motion"}
    >
      {enabled ? "Reduced Motion: On" : "Reduced Motion: Off"}
    </button>
  );
}
