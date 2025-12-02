import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, Target } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "emergency_fund", label: "Emergency Fund", emoji: "🛡️" },
  { value: "vacation", label: "Vacation", emoji: "✈️" },
  { value: "home", label: "Home", emoji: "🏡" },
  { value: "car", label: "Car", emoji: "🚗" },
  { value: "education", label: "Education", emoji: "🎓" },
  { value: "retirement", label: "Retirement", emoji: "🌅" },
  { value: "investment", label: "Investment", emoji: "📈" },
  { value: "other", label: "Other", emoji: "🎯" }
];

const PRIORITIES = [
  { value: "high", label: "High", color: "#FF5733" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "low", label: "Low", color: "#4CC9F0" }
];

export default function SavingsGoalForm({ onClose, onSave, initialGoal = null }) {
  const [goal, setGoal] = useState(initialGoal || {
    goalName: "",
    targetAmount: "",
    currentAmount: 0,
    targetDate: "",
    category: "emergency_fund",
    emoji: "🛡️",
    monthlyContribution: "",
    priority: "medium"
  });
  const [saving, setSaving] = useState(false);

  const handleCategoryChange = (category) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    setGoal({
      ...goal,
      category,
      emoji: categoryData.emoji
    });
  };

  const calculateMonthlyContribution = () => {
    if (goal.targetAmount && goal.targetDate) {
      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount) || 0;
      const remaining = target - current;
      
      const today = new Date();
      const targetDate = new Date(goal.targetDate);
      const monthsRemaining = Math.max(
        (targetDate.getFullYear() - today.getFullYear()) * 12 + 
        (targetDate.getMonth() - today.getMonth()),
        1
      );
      
      const monthly = remaining / monthsRemaining;
      setGoal({ ...goal, monthlyContribution: monthly.toFixed(2) });
    }
  };

  const handleSave = async () => {
    if (!goal.goalName.trim()) {
      toast.error('Please enter a goal name');
      return;
    }

    if (!goal.targetAmount || parseFloat(goal.targetAmount) <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...goal,
        targetAmount: parseFloat(goal.targetAmount),
        currentAmount: parseFloat(goal.currentAmount) || 0,
        monthlyContribution: goal.monthlyContribution ? parseFloat(goal.monthlyContribution) : null
      });
      toast.success('Savings goal saved! 💰');
    } catch (error) {
      toast.error('Failed to save goal');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-green-400" />
            {initialGoal ? 'Edit' : 'Create'} Savings Goal
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Goal Name */}
          <div>
            <Label className="text-white mb-2 block">Goal Name *</Label>
            <Input
              value={goal.goalName}
              onChange={(e) => setGoal({ ...goal, goalName: e.target.value })}
              placeholder="e.g., Emergency Fund, Dream Vacation"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-white mb-3 block">Category *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    goal.category === cat.value
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-white text-xs font-bold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amounts */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Target Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={goal.targetAmount}
                  onChange={(e) => setGoal({ ...goal, targetAmount: e.target.value })}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white pl-7"
                />
              </div>
            </div>
            <div>
              <Label className="text-white mb-2 block">Current Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={goal.currentAmount}
                  onChange={(e) => setGoal({ ...goal, currentAmount: e.target.value })}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white pl-7"
                />
              </div>
            </div>
          </div>

          {/* Target Date */}
          <div>
            <Label className="text-white mb-2 block">Target Date (Optional)</Label>
            <Input
              type="date"
              value={goal.targetDate}
              onChange={(e) => setGoal({ ...goal, targetDate: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Monthly Contribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white">Recommended Monthly Contribution</Label>
              <Button
                onClick={calculateMonthlyContribution}
                size="sm"
                className="bg-blue-500/20 text-blue-400 border border-blue-500/40"
                disabled={!goal.targetAmount || !goal.targetDate}
              >
                Calculate
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
              <Input
                type="number"
                step="0.01"
                value={goal.monthlyContribution}
                onChange={(e) => setGoal({ ...goal, monthlyContribution: e.target.value })}
                placeholder="0.00"
                className="bg-white/10 border-white/20 text-white pl-7"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label className="text-white mb-3 block">Priority</Label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORITIES.map(priority => (
                <button
                  key={priority.value}
                  onClick={() => setGoal({ ...goal, priority: priority.value })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    goal.priority === priority.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={goal.priority === priority.value ? {
                    backgroundColor: `${priority.color}20`,
                    borderColor: priority.color
                  } : {}}
                >
                  <div className="text-white font-bold">{priority.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Goal'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}