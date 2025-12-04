import { useMemo } from "react";
import PropTypes from "prop-types";
import { cn } from "@/utils";
import "./StarfieldBackground.css";

const PARTICLE_COUNT = 72;

const createParticleConfig = () =>
  Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 12,
    duration: 12 + Math.random() * 18,
    size: 1 + Math.random() * 1.5,
  }));

export default function StarfieldBackground({ className }) {
  const particles = useMemo(() => createParticleConfig(), []);

  return (
    <div className={cn("ns-starfield", className)} aria-hidden="true">
      <div className="ns-starfield__gradient" />
      <div className="ns-starfield__glow" />
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="ns-starfield__particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

StarfieldBackground.propTypes = {
  className: PropTypes.string,
};
