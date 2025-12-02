import React from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";

export default function WeeklySegmentBar({ 
  dailyData = {}, // { 'yyyy-MM-dd': value }
  dailyGoal = 30,
  weeklyGoal = 210,
  color = "#FF5733",
  label = "This Week",
  unit = "min",
  emptyLabel = "Rest day"
}) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const value = dailyData[dateStr] || 0;
    const goalMet = value >= dailyGoal;
    
    return {
      date,
      dateStr,
      value,
      goalMet,
      dayName: format(date, 'EEE'),
      isToday: dateStr === format(new Date(), 'yyyy-MM-dd')
    };
  });

  const totalWeek = Object.values(dailyData).reduce((sum, v) => sum + v, 0);
  const weekProgress = (totalWeek / weeklyGoal) * 100;
  const daysCompleted = weekDays.filter(d => d.goalMet).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color }} />
          <span className="text-white font-bold">{label}</span>
        </div>
        <div className="text-right">
          <motion.div 
            className="text-xl font-bold"
            style={{ color }}
            key={totalWeek}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {totalWeek} {unit}
          </motion.div>
          <div className="text-xs text-white/60">
            {daysCompleted}/7 days • Goal: {weeklyGoal} {unit}
          </div>
        </div>
      </div>

      {/* Weekly segments */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const heightPercentage = dailyGoal > 0 
            ? Math.min(100, (day.value / dailyGoal) * 100) 
            : 0;

          return (
            <motion.div 
              key={day.dateStr}
              className="relative group cursor-default"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Day label */}
              <div className={`text-center text-xs mb-1.5 font-medium ${
                day.isToday ? 'text-white' : 'text-white/60'
              }`}>
                {day.dayName}
              </div>

              {/* Bar */}
              <div 
                className="relative h-24 bg-white/10 rounded-lg overflow-hidden flex flex-col justify-end"
                style={{
                  border: day.isToday ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <motion.div 
                  className="w-full rounded-t-lg relative"
                  style={{ 
                    background: day.goalMet 
                      ? `linear-gradient(to top, ${color}, ${color}CC)`
                      : `linear-gradient(to top, ${color}60, ${color}40)`,
                    boxShadow: day.goalMet ? `0 0 10px ${color}60` : 'none'
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                    delay: idx * 0.05 + 0.2
                  }}
                >
                  {/* Goal indicator line */}
                  {heightPercentage > 0 && (
                    <div 
                      className="absolute top-0 left-0 right-0 h-0.5 bg-white/40"
                    />
                  )}
                </motion.div>

                {/* Goal met checkmark */}
                {day.goalMet && (
                  <motion.div 
                    className="absolute top-1 left-1/2 transform -translate-x-1/2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: idx * 0.05 + 0.4,
                      type: "spring",
                      stiffness: 400
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white drop-shadow-lg" />
                  </motion.div>
                )}

                {/* Today indicator */}
                {day.isToday && (
                  <motion.div 
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ 
                      scale: [1, 1.3, 1],
                      boxShadow: [`0 0 0 ${color}`, `0 0 10px ${color}`, `0 0 0 ${color}`]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}

                {/* Hover tooltip */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-white font-bold text-sm">{day.value} {unit}</div>
                    <div className="text-white/60 text-xs">
                      {day.goalMet ? '✓ Goal met' : emptyLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="text-center text-xs text-white/40 mt-1">
                {format(day.date, 'd')}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white/60 text-xs">Weekly Goal</span>
          <span className="text-white/60 text-xs">{Math.round(weekProgress)}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full"
            style={{ 
              background: `linear-gradient(to right, ${color}, ${color}CC)`,
              boxShadow: `0 0 8px ${color}60`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, weekProgress)}%` }}
            transition={{ 
              type: "spring", 
              stiffness: 80, 
              damping: 20,
              delay: 0.5
            }}
          />
        </div>
      </div>
    </div>
  );
}