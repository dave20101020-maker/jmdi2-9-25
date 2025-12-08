import React from 'react';

export default function WeeklyTrendsCard() {
  const points = [62, 64, 60, 66, 70, 68, 72];
  return (
    <div className="rounded-2xl bg-[#0b1220]/80 backdrop-blur-md shadow-lg shadow-blue-900/30 border border-white/5 p-4">
      <div className="text-sm text-white/70">Weekly Trends</div>
      <div className="mt-3 text-white/60 text-sm">Placeholder sparkline:</div>
      <div className="mt-2 flex items-end gap-1 h-20">
        {points.map((v, i) => (
          <div key={i} className="w-6 bg-blue-500/60 rounded-t" style={{ height: `${v/1.2}%` }} />
        ))}
      </div>
    </div>
  );
}
