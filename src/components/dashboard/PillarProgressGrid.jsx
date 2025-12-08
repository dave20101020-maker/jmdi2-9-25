import React from 'react';

const mock = [
  { id: 'sleep', label: 'Sleep', pct: 72 },
  { id: 'diet', label: 'Diet', pct: 65 },
  { id: 'exercise', label: 'Exercise', pct: 58 },
  { id: 'mental', label: 'Mental Health', pct: 70 },
  { id: 'finances', label: 'Finances', pct: 61 },
  { id: 'social', label: 'Social', pct: 69 },
];

export default function PillarProgressGrid({ data }) {
  const pillars = data ?? mock;
  return (
    <div className="rounded-2xl bg-[#0b1220]/80 backdrop-blur-md shadow-lg shadow-blue-900/30 border border-white/5 p-4">
      <div className="text-sm text-white/70">Pillar Progress</div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
        {pillars.map(p => (
          <div key={p.id} className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-white/70">{p.label}</div>
            <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
              <div className="h-2 bg-blue-500/70" style={{ width: `${p.pct}%` }} />
            </div>
            <div className="mt-1 text-white/80 text-xs">{p.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
