import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Plus, Minus, Target, TrendingUp, Award, Flame } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function WaterTracker({ waterData, onUpdate, compact = false }) {
  const [glasses, setGlasses] = useState(waterData?.glassesConsumed || 0);
  const [goal, setGoal] = useState(waterData?.dailyGoal || 8);
  const [showGoalEdit, setShowGoalEdit] = useState(false);

  useEffect(() => {
    setGlasses(waterData?.glassesConsumed || 0);
    setGoal(waterData?.dailyGoal || 8);
  }, [waterData]);

  const addGlass = () => {
    const newGlasses = glasses + 1;
    setGlasses(newGlasses);
    onUpdate({
      glassesConsumed: newGlasses,
      dailyGoal: goal,
      timestamps: [...(waterData?.timestamps || []), new Date().toISOString()]
    });

    if (newGlasses === goal) {
      toast.success('🎉 Daily water goal reached!', {
        description: `${newGlasses} glasses (${newGlasses * 250}ml)`
      });
    } else if (newGlasses < goal) {
      toast.success(`+1 glass (${newGlasses}/${goal})`, {
        description: `${newGlasses * 250}ml / ${goal * 250}ml`
      });
    }
  };

  const removeGlass = () => {
    if (glasses > 0) {
      const newGlasses = glasses - 1;
      setGlasses(newGlasses);
      const timestamps = waterData?.timestamps || [];
      onUpdate({
        glassesConsumed: newGlasses,
        dailyGoal: goal,
        timestamps: timestamps.slice(0, -1)
      });
    }
  };

  const updateGoal = (newGoal) => {
    setGoal(newGoal);
    onUpdate({
      glassesConsumed: glasses,
      dailyGoal: newGoal,
      timestamps: waterData?.timestamps || []
    });
    setShowGoalEdit(false);
    toast.success(`Daily goal updated to ${newGoal} glasses`);
  };

  const percentage = Math.min(Math.round((glasses / goal) * 100), 100);
  const goalReached = glasses >= goal;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-400" />
            <h3 className="text-white font-bold">Water Intake</h3>
          </div>
          {goalReached && (
            <Award className="w-6 h-6 text-[#D4AF37]" />
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={removeGlass}
            disabled={glasses === 0}
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <Minus className="w-5 h-5" />
          </Button>

          <div className="flex-1 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-1">{glasses}</div>
            <div className="text-white/60 text-sm">of {goal} glasses</div>
            <div className="text-white/40 text-xs">{glasses * 250}ml / {goal * 250}ml</div>
          </div>

          <Button
            onClick={addGlass}
            size="icon"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-center text-white/60 text-xs mt-2">{percentage}% of daily goal</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Droplets className="w-6 h-6 text-blue-400" />
          Water Tracker
        </h3>
        {goalReached && (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-sm font-bold">Goal Reached!</span>
          </div>
        )}
      </div>

      {/* Glass Display */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <Button
          onClick={removeGlass}
          disabled={glasses === 0}
          size="icon"
          className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          <Minus className="w-6 h-6" />
        </Button>

        <div className="text-center">
          <div className="text-6xl font-bold text-blue-400 mb-2">{glasses}</div>
          <div className="text-white/70 mb-1">glasses today</div>
          <div className="text-white/40 text-sm">{glasses * 250}ml</div>
        </div>

        <Button
          onClick={addGlass}
          size="icon"
          className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
          style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">Daily Progress</span>
          <span className="text-blue-400 font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${percentage}%` }}
          >
            {percentage > 20 && <Droplets className="w-3 h-3 text-white" />}
          </div>
        </div>
      </div>

      {/* Goal Setting */}
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-white/80 text-sm">Daily Goal</span>
          </div>
          {!showGoalEdit && (
            <button
              onClick={() => setShowGoalEdit(true)}
              className="text-blue-400 hover:text-blue-300 text-sm font-bold"
            >
              Change
            </button>
          )}
        </div>

        {showGoalEdit ? (
          <div className="space-y-3">
            <div className="flex gap-2 justify-center">
              {[6, 8, 10, 12].map(amount => (
                <button
                  key={amount}
                  onClick={() => updateGoal(amount)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-blue-500/20 hover:border-blue-500/40 transition-all"
                >
                  {amount}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowGoalEdit(false)}
              size="sm"
              variant="ghost"
              className="w-full text-white/60 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">{goal}</div>
            <div className="text-white/60 text-sm">glasses ({goal * 250}ml)</div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-white/70 text-xs">
          💡 <strong>Tip:</strong> Carry a reusable water bottle and set hourly reminders to stay hydrated throughout the day!
        </p>
      </div>
    </div>
  );
}