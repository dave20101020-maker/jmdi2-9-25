import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, PieChart, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "housing", label: "Housing", emoji: "🏠", color: "#FF5733" },
  { value: "food", label: "Food", emoji: "🍽️", color: "#52B788" },
  { value: "transportation", label: "Transport", emoji: "🚗", color: "#4CC9F0" },
  { value: "utilities", label: "Utilities", emoji: "💡", color: "#FFD700" },
  { value: "healthcare", label: "Healthcare", emoji: "❤️", color: "#FF7F50" },
  { value: "entertainment", label: "Fun", emoji: "🎮", color: "#7C3AED" },
  { value: "shopping", label: "Shopping", emoji: "🛍️", color: "#FF69B4" },
  { value: "education", label: "Education", emoji: "📚", color: "#4169E1" },
  { value: "personal", label: "Personal", emoji: "✨", color: "#9370DB" },
  { value: "savings", label: "Savings", emoji: "💰", color: "#2E8B57" },
  { value: "other", label: "Other", emoji: "📝", color: "#808080" }
];

export default function BudgetManager({ onClose, onSave, initialBudget = null }) {
  const [budget, setBudget] = useState(initialBudget || {
    category: "food",
    monthlyLimit: "",
    alertThreshold: 80,
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!budget.monthlyLimit || parseFloat(budget.monthlyLimit) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setSaving(true);
    try {
      const categoryData = CATEGORIES.find(c => c.value === budget.category);
      await onSave({
        ...budget,
        monthlyLimit: parseFloat(budget.monthlyLimit),
        color: categoryData.color
      });
      toast.success('Budget saved! 📊');
    } catch (error) {
      toast.error('Failed to save budget');
      setSaving(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === budget.category);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-7 h-7 text-blue-400" />
            {initialBudget ? 'Edit' : 'Set'} Budget
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <Label className="text-white mb-3 block">Category *</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setBudget({ ...budget, category: cat.value })}
                  disabled={initialBudget}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    budget.category === cat.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  } ${initialBudget ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={budget.category === cat.value ? {
                    backgroundColor: `${cat.color}20`,
                    borderColor: cat.color
                  } : {}}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-white text-xs font-bold">{cat.label}</div>
                </button>
              ))}
            </div>
            {initialBudget && (
              <p className="text-white/60 text-sm mt-2">Category cannot be changed after creation</p>
            )}
          </div>

          {/* Monthly Limit */}
          <div>
            <Label className="text-white mb-2 block">Monthly Budget Limit *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-lg">$</span>
              <Input
                type="number"
                step="0.01"
                value={budget.monthlyLimit}
                onChange={(e) => setBudget({ ...budget, monthlyLimit: e.target.value })}
                placeholder="0.00"
                className="bg-white/10 border-white/20 text-white text-lg pl-8"
              />
            </div>
            <p className="text-white/60 text-sm mt-2">
              Set how much you want to spend on{' '}
              <span style={{ color: selectedCategory.color }} className="font-bold">
                {selectedCategory.label}
              </span>
              {' '}each month
            </p>
          </div>

          {/* Alert Threshold */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Alert Threshold
              </Label>
              <span className="text-orange-400 font-bold">{budget.alertThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={budget.alertThreshold}
              onChange={(e) => setBudget({ ...budget, alertThreshold: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-white/60 text-sm mt-2">
              Get notified when you've spent {budget.alertThreshold}% of your budget
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <div className="text-white font-medium">Active Budget</div>
              <div className="text-white/60 text-sm">Track expenses against this budget</div>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                budget.isActive ? 'bg-green-500' : 'bg-white/20'
              }`}
              onClick={() => setBudget({ ...budget, isActive: !budget.isActive })}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  budget.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Budget Breakdown Tip */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white/70 text-sm">
              💡 <strong>Tip:</strong> The 50/30/20 rule suggests: 50% needs, 30% wants, 20% savings. Adjust your budgets accordingly!
            </p>
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
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}