import { api } from "@/utils/apiClient";
import React, { useState } from "react";
import { Flame, Snowflake, Info } from "lucide-react";
import { STREAK_BADGES } from "@/hooks/useStreak";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function StreakDisplay({ streak, user, compact = false }) {
  const queryClient = useQueryClient();
  const [freezing, setFreezing] = useState(false);
  
  const badge = STREAK_BADGES[streak.streakBadge];
  
  const handleFreeze = async () => {
    if (!streak.canFreeze) {
      toast.error("No streak freezes available");
      return;
    }
    
    const confirmed = window.confirm(
      `Use a streak freeze? You have ${streak.freezesRemaining} freeze${streak.freezesRemaining !== 1 ? 's' : ''} remaining this month.\n\nThis will protect your streak if you miss tomorrow.`
    );
    
    if (!confirmed) return;
    
    setFreezing(true);
    try {
      await api.authUpdateMe({
        streak_freeze_date: new Date().toISOString().split('T')[0],
        streak_freezes_available: (user?.streak_freezes_available || 0) - 1
      });
      
      queryClient.invalidateQueries(['user']);
      toast.success("Streak freeze activated! You're protected for tomorrow.");
    } catch (error) {
      console.error("Failed to freeze streak:", error);
      toast.error("Failed to freeze streak. Please try again.");
    } finally {
      setFreezing(false);
    }
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ 
          background: `${badge.color}15`,
          border: `1px solid ${badge.color}40`
        }}
      >
        <Flame className="w-4 h-4" style={{ color: badge.color }} />
        <span className="text-sm font-bold text-white">{streak.currentStreak}</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
      style={{ boxShadow: `0 0 30px ${badge.glow}` }}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
        style={{ background: badge.color, filter: 'blur(60px)' }}
      />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ 
                background: `${badge.color}20`,
                boxShadow: `0 0 20px ${badge.glow}`
              }}
            >
              <Flame className="w-8 h-8" style={{ color: badge.color }} />
            </div>
            <div>
              <div className="text-white/60 text-sm">Current Streak</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{streak.currentStreak}</span>
                <span className="text-xl text-white/60">day{streak.currentStreak !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: badge.color }}>
                {badge.label} Streak
              </div>
            </div>
          </div>
          
          {/* Freeze button */}
          {streak.canFreeze && (
            <Button
              onClick={handleFreeze}
              disabled={freezing}
              size="sm"
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40"
            >
              <Snowflake className="w-4 h-4 mr-2" />
              Freeze ({streak.freezesRemaining})
            </Button>
          )}
        </div>
        
        {/* Status message */}
        <div className="mb-4">
          {streak.todayLogged ? (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              Logged today - streak active!
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Log an entry to continue your streak
            </div>
          )}
        </div>
        
        {/* Progress to next milestone */}
        <div>
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Next milestone</span>
            <span className="font-bold text-white">{streak.nextMilestone} days</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(streak.progressToMilestone, 100)}%`,
                background: `linear-gradient(to right, ${badge.color}, ${badge.color}dd)`,
                boxShadow: `0 0 10px ${badge.glow}`
              }}
            />
          </div>
          <div className="text-xs text-white/40 mt-1">
            {streak.nextMilestone - streak.currentStreak} days to go
          </div>
        </div>
        
        {/* Personal best */}
        {streak.longestStreak > streak.currentStreak && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Personal best</span>
              <span className="font-bold text-white">{streak.longestStreak} days 🏆</span>
            </div>
          </div>
        )}
        
        {/* Info about freezes */}
        {!streak.canFreeze && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-400">
              <div className="font-semibold mb-1">No streak freezes available</div>
              <div className="text-blue-400/80">
                Freezes reset monthly. Premium users get 3/month, Free users get 1/month.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}