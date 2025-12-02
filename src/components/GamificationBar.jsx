import React from 'react'

export default function GamificationBar({ level = 1, xp = 0, xpToNext = 100, streak = 0 }) {
  const progress = (xp / xpToNext) * 100

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-sm text-white/60">Level</div>
              <div className="text-xl font-bold text-white">{level}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-sm text-white/60">Streak</div>
              <div className="text-xl font-bold text-orange-400">{streak} days</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-white/60">XP Progress</div>
          <div className="text-lg font-bold text-white">
            {xp} / {xpToNext}
          </div>
        </div>
      </div>
      <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
