import React, { useMemo } from "react";
import "./StarfieldBackground.css";

const STAR_COUNT = 90;
const COMET_COUNT = 2;

export function StarfieldBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }).map((_, index) => ({
        id: index,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1 + Math.random() * 1.5,
        delay: Math.random() * 8,
        duration: 3 + Math.random() * 4,
      })),
    []
  );

  const comets = useMemo(
    () =>
      Array.from({ length: COMET_COUNT }).map((_, index) => ({
        id: index,
        fromSide: ["top", "right", "bottom", "left"][index % 4],
        delay: index * 6 + Math.random() * 4,
        duration: 6 + Math.random() * 4,
      })),
    []
  );

  return (
    <div className="ns-starfield" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="ns-starfield__star"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {comets.map((comet) => (
        <div
          key={comet.id}
          className={`ns-starfield__comet ns-starfield__comet--${comet.fromSide}`}
          style={{
            animationDelay: `${comet.delay}s`,
            animationDuration: `${comet.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default StarfieldBackground;
