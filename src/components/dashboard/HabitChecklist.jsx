import React from 'react';

export default function HabitChecklist({ items }) {
  const habits = items ?? [
    { id: 'water', label: 'Drink water', done: false },
    { id: 'walk', label: 'Walk 20 minutes', done: true },
    { id: 'reflect', label: 'Evening reflection', done: false },
  ];

  return (
    <div className="rounded-2xl bg-[#0b1220]/80 backdrop-blur-md shadow-lg shadow-blue-900/30 border border-white/5 p-4">
      <div className="text-sm text-white/70">Habit Checklist</div>
      <ul className="mt-3 space-y-2">
        {habits.map(h => (
          <li key={h.id} className="flex items-center gap-3">
            <input type="checkbox" checked={h.done} readOnly className="h-4 w-4 rounded border-white/20 bg-transparent" />
            <span className={"text-white/80 " + (h.done ? 'line-through text-white/50' : '')}>{h.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
