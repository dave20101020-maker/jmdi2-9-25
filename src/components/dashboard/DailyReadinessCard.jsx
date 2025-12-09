import React from "react";

export default function DailyReadinessCard({
  score = 82,
  trend = 3,
  highlight = "Recovered sleep debt and balanced nutrition",
}) {
  const trendColor = trend >= 0 ? "text-green-400" : "text-red-400";
  const trendLabel = trend >= 0 ? `+${trend}` : trend;

  return (
    <div className="rounded-2xl bg-[#0b1220]/80 backdrop-blur-md shadow-lg shadow-blue-900/30 border border-white/5 p-4">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>Daily Readiness</span>
        <span className={`${trendColor} font-semibold`}>
          {trendLabel} vs yesterday
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <div className="text-4xl font-semibold text-white">{score}</div>
        <div className="px-2 py-1 rounded-lg bg-white/5 text-white/80 text-xs">
          /100
        </div>
      </div>
      <p className="mt-2 text-white/70 text-sm leading-relaxed">{highlight}</p>
    </div>
  );
}
