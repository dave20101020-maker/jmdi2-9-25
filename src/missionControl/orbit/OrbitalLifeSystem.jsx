import React from "react";
import { PILLAR_ORBITS } from "./pillarOrbitConfig";

function clampScore(value) {
  const n = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

const ORBIT_RADIUS = 110; // px

function getAngleForIndex(index, total) {
  return (360 / total) * index;
}

function PillarDot({ pillarKey, score, color }) {
  const clamped = clampScore(score);

  return (
    <div
      className="group w-5 h-5 rounded-full grid place-items-center border border-white/60 outline-none"
      style={{ backgroundColor: color }}
      tabIndex={0}
      aria-label={`${pillarKey} score ${clamped}`}
    >
      <span className="text-[12px] font-semibold text-navy opacity-0 group-hover:opacity-100 group-focus:opacity-100">
        {clamped}
      </span>
    </div>
  );
}

export default function OrbitalLifeSystem({
  lifeScore = 0,
  pillarScores = {},
}) {
  const totalPillars = PILLAR_ORBITS.length;

  return (
    <div className="relative w-80 h-80 mx-auto flex items-center justify-center overflow-visible">
      {/* Subtle guide ring (structure, no animation) */}
      <div
        className="absolute inset-10 rounded-full border border-white/5"
        aria-hidden="true"
      />

      {/* Center (immutable) */}
      <div className="relative z-10 w-[72px] h-[72px] rounded-full bg-gold shadow-ns-card flex items-center justify-center">
        <span
          className="text-[48px] font-semibold leading-none text-navy"
          style={{ letterSpacing: "-0.02em" }}
        >
          {clampScore(lifeScore)}
        </span>
      </div>

      {/* Orbits (exactly 8 bodies) */}
      {PILLAR_ORBITS.map((pillar, index) => {
        const score = pillarScores?.[pillar.key];

        const angle = getAngleForIndex(index, totalPillars);
        return (
          <div
            key={pillar.key}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${ORBIT_RADIUS}px) rotate(-${angle}deg)`,
              transformOrigin: "center",
            }}
          >
            <PillarDot
              pillarKey={pillar.key}
              score={score}
              color={pillar.color}
            />
          </div>
        );
      })}
    </div>
  );
}
