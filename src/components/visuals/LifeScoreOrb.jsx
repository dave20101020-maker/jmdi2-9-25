import { useEffect, useState } from "react";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function LifeScoreOrb() {
  const [score, setScore] = useState(75);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore((prev) => {
        const target = Math.floor(Math.random() * (95 - 60 + 1)) + 60;
        return target;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const dashOffset =
    CIRCUMFERENCE - (Math.min(100, Math.max(0, score)) / 100) * CIRCUMFERENCE;

  const color = score < 50 ? "#f87171" : score < 70 ? "#facc15" : "#4ade80";

  return (
    <div className="relative w-[300px] h-[300px] mx-auto">
      <svg viewBox="0 0 120 120" className="absolute inset-0 p-12">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          stroke="#374151"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-indigo-400">
        {score}
      </div>

      {/* Orbiting Pillars */}
      <div className="absolute inset-0 animate-[spin_40s_linear_infinite]">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 rounded-full shadow-lg"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 45}deg) translate(150px)`,
              backgroundColor: [
                "#f87171",
                "#facc15",
                "#4ade80",
                "#3b82f6",
                "#e879f9",
                "#fb923c",
                "#60a5fa",
                "#eab308",
              ][i],
            }}
          />
        ))}
      </div>
    </div>
  );
}
