import React from "react";
import { getUserLevel, getNextLevel } from "@/utils/achievementBadges";
import { Zap } from "lucide-react";

export default function LevelDisplay({ points, compact = false }) {
  const currentLevel = getUserLevel(points);
  const nextLevel = getNextLevel(points);
  
  const progress = nextLevel 
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ 
          background: `${currentLevel.color}15`,
          border: `1px solid ${currentLevel.color}40`
        }}
      >
        <span className="text-xl">{currentLevel.icon}</span>
        <span className="text-sm font-bold text-white">{currentLevel.name}</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
      style={{ boxShadow: `0 0 20px ${currentLevel.color}30` }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ 
            background: `${currentLevel.color}20`,
            boxShadow: `0 0 20px ${currentLevel.color}40`
          }}
        >
          {currentLevel.icon}
        </div>
        <div className="flex-1">
          <div className="text-white/60 text-sm">Your Level</div>
          <div className="text-2xl font-bold text-white">{currentLevel.name}</div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4" style={{ color: currentLevel.color }} />
            <span className="text-white/70">{points.toLocaleString()} points</span>
          </div>
        </div>
      </div>
      
      {nextLevel && (
        <div>
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Next: {nextLevel.name} {nextLevel.icon}</span>
            <span className="font-bold text-white">{nextLevel.minPoints.toLocaleString()} pts</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                background: `linear-gradient(to right, ${currentLevel.color}, ${nextLevel.color})`,
                boxShadow: `0 0 10px ${currentLevel.color}60`
              }}
            />
          </div>
          <div className="text-xs text-white/40 mt-1">
            {(nextLevel.minPoints - points).toLocaleString()} points to go
          </div>
        </div>
      )}
    </div>
  );
}