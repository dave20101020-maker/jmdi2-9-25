import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, Award } from "lucide-react";
import { format, startOfWeek } from "date-fns";

export default function ActiveMinutesWidget({ weekData, onLogMinutes }) {
  const dailyGoal = weekData?.dailyGoal || 30;
  const weeklyGoal = weekData?.weeklyGoal || 210;
  const totalMinutes = weekData?.totalMinutes || 0;
  const minutesPerDay = weekData?.minutesPerDay || {};
  const daysCompleted = weekData?.daysCompleted || 0;

  const weeklyProgress = Math.round((totalMinutes / weeklyGoal) * 100);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMinutes = minutesPerDay[today] || 0;
  const todayProgress = Math.round((todayMinutes / dailyGoal) * 100);
  const todayGoalReached = todayMinutes >= dailyGoal;

  return (
    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-orange-400" />
          Active Minutes
        </h3>
        {todayGoalReached && (
          <Award className="w-6 h-6 text-[#D4AF37]" />
        )}
      </div>

      {/* Today's Progress */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">Today's Goal</span>
          <span className="text-orange-400 font-bold">{todayMinutes}/{dailyGoal} min</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
            style={{ width: `${Math.min(todayProgress, 100)}%` }}
          />
        </div>
        <div className="text-white/60 text-xs">{todayProgress}% complete</div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            This Week
          </span>
          <span className="text-[#D4AF37] font-bold">{totalMinutes}/{weeklyGoal} min</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] transition-all duration-500"
            style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">{weeklyProgress}% complete</span>
          <span className="text-white/60">{daysCompleted}/7 days met goal</span>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
          const date = new Date(weekStart);
          date.setDate(date.getDate() + idx);
          const dateKey = format(date, 'yyyy-MM-dd');
          const minutes = minutesPerDay[dateKey] || 0;
          const goalMet = minutes >= dailyGoal;

          return (
            <div key={day} className="text-center">
              <div className="text-white/60 text-xs mb-1">{day}</div>
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                  goalMet
                    ? 'bg-green-500/30 border-2 border-green-500 text-green-400'
                    : minutes > 0
                    ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                    : 'bg-white/5 border border-white/10 text-white/40'
                }`}
              >
                {minutes > 0 ? minutes : '–'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Log */}
      <div className="flex gap-2">
        {[15, 30, 45, 60].map(mins => (
          <button
            key={mins}
            onClick={() => onLogMinutes(mins)}
            className="flex-1 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-orange-500/20 hover:border-orange-500/40 transition-all font-bold text-sm"
          >
            +{mins}
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-white/70 text-xs">
          💡 <strong>Tip:</strong> WHO recommends 150 minutes of moderate activity per week (about 30 min/day)
        </p>
      </div>
    </div>
  );
}