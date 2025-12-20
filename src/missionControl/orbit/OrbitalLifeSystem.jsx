import React, { useEffect, useMemo, useRef, useState } from "react";
import { PILLAR_ORBITS } from "./pillarOrbitConfig";

function clampScore(value) {
  const n = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Solar-system style: 8 fixed rings, each ring rotates (calm), planet is stable on ring.
const RING_ORDER = [
  "mental", // Mercury
  "social", // Venus
  "exercise", // Mars
  "physical", // Earth
  "finances", // Jupiter
  "sleep", // Saturn
  "spiritual", // Uranus
  "diet", // Neptune
];

const BASE_RING_RADIUS = 72;
const RING_STEP = 14;

// Fixed angles so the system feels stable (no randomness).
const FIXED_ANGLES = {
  mental: 18,
  social: 65,
  exercise: 122,
  physical: 200,
  finances: 255,
  sleep: 310,
  spiritual: 145,
  diet: 35,
};

// Very slow, calm orbital speeds (seconds per revolution).
const RING_PERIOD_S = [60, 78, 96, 120, 150, 190, 240, 300];

export default function OrbitalLifeSystem({
  lifeScore = 0,
  pillarScores = {},
}) {
  const clampedLifeScore = clampScore(lifeScore);

  const planets = useMemo(() => {
    const configByKey = Object.fromEntries(
      Array.isArray(PILLAR_ORBITS) ? PILLAR_ORBITS.map((p) => [p.key, p]) : []
    );

    return RING_ORDER.map((pillarId, idx) => {
      const cfg = configByKey[pillarId] ?? { key: pillarId, label: pillarId };
      const score = clampScore(pillarScores?.[pillarId]);
      const angle = FIXED_ANGLES[pillarId] ?? idx * 45;
      const radius = BASE_RING_RADIUS + idx * RING_STEP;
      const period = RING_PERIOD_S[idx] ?? 120;
      return {
        pillarId,
        cfg,
        score,
        angle,
        radius,
        period,
        idx,
      };
    });
  }, [pillarScores]);

  const [pulseLifeScore, setPulseLifeScore] = useState(false);
  const pulseTimerRef = useRef(null);

  useEffect(() => {
    setPulseLifeScore(true);

    if (pulseTimerRef.current) {
      window.clearTimeout(pulseTimerRef.current);
    }

    pulseTimerRef.current = window.setTimeout(() => {
      setPulseLifeScore(false);
      pulseTimerRef.current = null;
    }, 260);

    return () => {
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    };
  }, [clampedLifeScore]);

  return (
    <div className="orbital-solar">
      {/* STAR CORE */}
      <div
        className={`orbital-star ${pulseLifeScore ? "lifescore-pulse" : ""}`}
        aria-label={`NorthStar LifeScore ${clampedLifeScore}`}
      >
        <div className="orbital-starCore">{clampedLifeScore}</div>
      </div>

      {/* ORBIT RINGS (8) */}
      {planets.map((p) => {
        const style = {
          "--ring-radius": `${p.radius}px`,
          "--ring-period": `${p.period}s`,
          "--planet-angle": `${p.angle}deg`,
          "--planet-accent":
            p.cfg?.accent ?? "hsl(var(--pillar-default) / 0.18)",
        };

        return (
          <div
            key={p.pillarId}
            className={`orbit-ring orbit-ring--${p.idx}`}
            style={style}
            aria-hidden="true"
          >
            <div className="orbit-rotator">
              <div
                className={`orbit-planet orbit-planet--${p.pillarId}`}
                style={{
                  transform:
                    "rotate(var(--planet-angle)) translateX(var(--ring-radius))",
                }}
              >
                {/* planet body only (no numbers here) */}
                <span className="orbit-planetBody" />
              </div>
            </div>
          </div>
        );
      })}

      {/* ALWAYS-VISIBLE SCORE LEGEND (no hover friction) */}
      <div className="orbit-legend" role="list" aria-label="Pillar scores">
        {planets.map((p) => (
          <div key={p.pillarId} className="orbit-legendItem" role="listitem">
            <span
              className="orbit-legendDot"
              style={{
                background:
                  p.cfg?.accent ?? "hsl(var(--pillar-default) / 0.18)",
              }}
              aria-hidden="true"
            />
            <span className="orbit-legendLabel">
              {p.cfg?.label ?? p.pillarId}
            </span>
            <span className="orbit-legendScore">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
