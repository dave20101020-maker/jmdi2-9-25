import React, { useState } from 'react'

export default function HabitTracker({ habits = [], onToggle = () => {} }) {
  const [checkedHabits, setCheckedHabits] = useState(new Set())

  const handleToggle = (habitId) => {
    const newChecked = new Set(checkedHabits)
    if (newChecked.has(habitId)) {
      newChecked.delete(habitId)
    } else {
      newChecked.add(habitId)
    }
    setCheckedHabits(newChecked)
    onToggle(habitId, newChecked.has(habitId))
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
        <span className="text-4xl mb-2 block">✅</span>
        <p className="text-white/60">No habits yet. Create your first habit to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="text-lg font-bold text-white mb-4">Today's Habits</h3>
      <div className="space-y-3">
        {habits.map((habit) => {
          const isChecked = checkedHabits.has(habit.id)
          return (
            <div
              key={habit.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                isChecked
                  ? 'bg-green-500/20 border border-green-400/30'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
              onClick={() => handleToggle(habit.id)}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isChecked
                    ? 'bg-green-500 border-green-400'
                    : 'border-white/30'
                }`}
              >
                {isChecked && <span className="text-white text-sm">✓</span>}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${isChecked ? 'text-white line-through' : 'text-white'}`}>
                  {habit.name || habit.title}
                </div>
                {habit.description && (
                  <div className="text-xs text-white/60 mt-1">{habit.description}</div>
                )}
              </div>
              {habit.streak && (
                <div className="flex items-center gap-1 text-orange-400">
                  <span>🔥</span>
                  <span className="text-sm font-bold">{habit.streak}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
