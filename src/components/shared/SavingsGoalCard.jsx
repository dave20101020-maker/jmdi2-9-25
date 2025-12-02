import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Plus, TrendingUp, Calendar, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SavingsGoalCard({ goal, onAddContribution, onEdit, onDelete }) {
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");

  const progress = goal.targetAmount > 0 
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  const handleAddContribution = () => {
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    onAddContribution(goal.id, amount);
    setContributionAmount("");
    setShowAddContribution(false);
  };

  const priorityColors = {
    high: "#FF5733",
    medium: "#FFD700",
    low: "#4CC9F0"
  };

  const categoryEmojis = {
    emergency_fund: "🛡️",
    vacation: "✈️",
    home: "🏡",
    car: "🚗",
    education: "🎓",
    retirement: "🌅",
    investment: "📈",
    other: "🎯"
  };

  return (
    <div 
      className="bg-[#1a1f35] border border-white/20 rounded-2xl p-5 hover:bg-white/5 transition-all"
      style={{ boxShadow: `0 0 20px ${priorityColors[goal.priority]}20` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl"
            style={{ 
              backgroundColor: `${priorityColors[goal.priority]}20`,
              boxShadow: `0 0 10px ${priorityColors[goal.priority]}40`
            }}
          >
            {goal.emoji || categoryEmojis[goal.category] || "💰"}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{goal.goalName}</h3>
            <p className="text-white/60 text-sm capitalize">
              {goal.category.replace('_', ' ')}
              {goal.targetDate && ` • ${format(new Date(goal.targetDate), 'MMM yyyy')}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(goal)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${goal.goalName}" savings goal?`)) {
                onDelete(goal.id);
              }
            }}
            className="text-white/60 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">Progress</span>
          <span className="font-bold" style={{ color: priorityColors[goal.priority] }}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, ${priorityColors[goal.priority]}, ${priorityColors[goal.priority]}CC)`
            }}
          />
        </div>
      </div>

      {/* Amount Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-white/60 text-xs mb-1">Current</div>
          <div className="text-white font-bold text-lg">
            ${goal.currentAmount?.toLocaleString() || 0}
          </div>
        </div>
        <div>
          <div className="text-white/60 text-xs mb-1">Target</div>
          <div className="text-white font-bold text-lg">
            ${goal.targetAmount?.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/60 text-xs">Remaining</div>
            <div className="text-white font-bold">${remaining.toLocaleString()}</div>
          </div>
          {goal.monthlyContribution && (
            <div className="text-right">
              <div className="text-white/60 text-xs">Monthly Goal</div>
              <div className="text-green-400 font-bold">${goal.monthlyContribution.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Contribution */}
      {!goal.isCompleted && (
        <>
          {showAddContribution ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddContribution()}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white pl-7"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleAddContribution}
                size="sm"
                className="bg-green-500/20 text-green-400 border border-green-500/40"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddContribution(false);
                  setContributionAmount("");
                }}
                size="sm"
                variant="outline"
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowAddContribution(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contribution
            </Button>
          )}
        </>
      )}

      {goal.isCompleted && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 text-center">
          <span className="text-green-400 font-bold">🎉 Goal Completed!</span>
        </div>
      )}
    </div>
  );
}