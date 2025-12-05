import React, { useMemo } from "react";
import "./LifeOrbitVisualizer.css";

/**
 * @param {Object[]} pillars - array of pillar objects { id, name, color, score }
 */
export function LifeOrbitVisualizer({ pillars }) {
  const safePillars = useMemo(() => pillars?.slice(0, 8) ?? [], [pillars]);

  const averageScore = useMemo(() => {
    if (!safePillars.length) return 0;
    const total = safePillars.reduce(
      (sum, pillar) => sum + (pillar.score ?? 0),
      0
    );
    return Math.round(total / safePillars.length);
  }, [safePillars]);

  return (
    <div className="life-orbit">
      <div className="life-orbit__center">
        <div className="life-orbit__center-label">Life Score</div>
        <div className="life-orbit__center-value">{averageScore}</div>
      </div>

      {safePillars.map((pillar, index) => {
        const ringIndex = index;
        const radius = 90 + ringIndex * 20;
        const duration = 18 + ringIndex * 2;

        return (
          <div
            key={pillar.id || index}
            className="life-orbit__ring"
            style={{
              "--orbit-radius": `${radius}px`,
              "--orbit-duration": `${duration}s`,
            }}
          >
            <div
              className="life-orbit__planet"
              style={{ backgroundColor: pillar.color || "#fff" }}
            >
              <span className="life-orbit__planet-score">
                {Math.round(pillar.score ?? 0)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default LifeOrbitVisualizer;
