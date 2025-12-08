import React from 'react';

export default function SleepSummaryCard({ data }) {
  const mockSleep = data ?? { hours: 6.5, score: 72 };
  return (
    <div className="rounded-2xl bg-[#0b1220]/80 backdrop-blur-md shadow-lg shadow-blue-900/30 border border-white/5 p-4 hover:shadow-blue-700/40 transition-shadow">
      <div className="text-sm text-white/70">Sleep</div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-3xl font-semibold text-white">{mockSleep.hours}h</div>
        <div className="px-2 py-1 rounded-lg bg-white/5 text-white/80 text-xs">Score {mockSleep.score}</div>
      </div>
      <div className="mt-2 text-white/60 text-sm">Placeholder data. Demo mode ready.</div>
    </div>
  );
}
