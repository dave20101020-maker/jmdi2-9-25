import React from "react";
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle2,
  Repeat,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl, PILLARS } from "@/utils";

export default function ActiveItemsWidget({
  plans = [],
  goals = [],
  habits = [],
}) {
  const activePlans = plans.filter((p) => p.isActive);
  const activeGoals = goals.filter((g) => g.status === "active");
  const activeHabits = habits.filter((h) => h.isActive);

  const totalActive =
    activePlans.length + activeGoals.length + activeHabits.length;

  if (totalActive === 0) {
    return (
      <motion.div
        className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Target className="w-12 h-12 mx-auto mb-3 text-white/40" />
        <p className="text-white/60 text-sm mb-4">
          No active plans, goals, or habits yet
        </p>
        <Link to={createPageUrl("MyGrowth")}>
          <motion.button
            className="px-4 py-2 bg-[#D4AF37] text-[#0A1628] rounded-lg font-semibold text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Your First Goal
          </motion.button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Your Active Goals</h3>
        <Link
          to={createPageUrl("MyGrowth")}
          className="text-[#D4AF37] text-sm hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {/* Active Plans */}
        {activePlans.slice(0, 2).map((plan) => {
          const pillar = PILLARS[plan.pillar];
          return (
            <Link
              key={plan.id}
              to={createPageUrl("PlanDetail") + `?id=${plan.id}`}
            >
              <motion.div
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group cursor-pointer"
                whileHover={{ x: 3 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${pillar?.color}20` }}
                  >
                    <Target
                      className="w-5 h-5"
                      style={{ color: pillar?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${pillar?.color}20`,
                          color: pillar?.color,
                        }}
                      >
                        Plan
                      </span>
                      <span className="text-xs text-white/40">
                        {pillar?.name}
                      </span>
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-2 line-clamp-1">
                      {plan.planTitle}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${plan.completionProgress || 0}%`,
                            backgroundColor: pillar?.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/60 whitespace-nowrap">
                        {plan.completionProgress || 0}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
                </div>
              </motion.div>
            </Link>
          );
        })}

        {/* Active Goals */}
        {activeGoals.slice(0, 2).map((goal) => {
          const pillar = PILLARS[goal.pillar];
          return (
            <Link
              key={goal.id}
              to={createPageUrl("Goals") + `?goalId=${goal.id}`}
            >
              <motion.div
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group cursor-pointer"
                whileHover={{ x: 3 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${pillar?.color}20` }}
                  >
                    <TrendingUp
                      className="w-5 h-5"
                      style={{ color: pillar?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${pillar?.color}20`,
                          color: pillar?.color,
                        }}
                      >
                        Goal
                      </span>
                      <span className="text-xs text-white/40">
                        {pillar?.name}
                      </span>
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                      {goal.specific || goal.goalStatement}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${goal.progress || 0}%`,
                            backgroundColor: pillar?.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/60 whitespace-nowrap">
                        {goal.progress || 0}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
                </div>
              </motion.div>
            </Link>
          );
        })}

        {/* Active Habits */}
        {activeHabits.slice(0, 2).map((habit) => {
          const pillar = PILLARS[habit.pillar];
          const today = new Date().toISOString().split("T")[0];
          const isCompletedToday = habit.completionDates?.includes(today);

          return (
            <Link key={habit.id} to={createPageUrl("Habits")}>
              <motion.div
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group cursor-pointer"
                whileHover={{ x: 3 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${pillar?.color}20` }}
                  >
                    <Repeat
                      className="w-5 h-5"
                      style={{ color: pillar?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${pillar?.color}20`,
                          color: pillar?.color,
                        }}
                      >
                        Habit
                      </span>
                      <span className="text-xs text-white/40">
                        {pillar?.name}
                      </span>
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                      {habit.habitText}
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-orange-400 text-lg">🔥</span>
                        <span className="text-sm font-bold text-orange-400">
                          {habit.streakCount || 0}
                        </span>
                        <span className="text-xs text-white/60">
                          day streak
                        </span>
                      </div>
                      {isCompletedToday && (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs">Done today</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
