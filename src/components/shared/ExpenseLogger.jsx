import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, DollarSign, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", emoji: "💵" },
  { value: "credit", label: "Credit Card", emoji: "💳" },
  { value: "debit", label: "Debit Card", emoji: "💳" },
  { value: "transfer", label: "Transfer", emoji: "🔄" },
  { value: "other", label: "Other", emoji: "📱" }
];

export default function ExpenseLogger({ onClose, onSave, initialExpense = null }) {
  const [expense, setExpense] = useState(initialExpense || {
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: "",
    category: "food",
    description: "",
    tags: [],
    paymentMethod: "credit",
    isRecurring: false,
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !expense.tags.includes(tagInput.trim())) {
      setExpense({
        ...expense,
        tags: [...expense.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setExpense({
      ...expense,
      tags: expense.tags.filter(t => t !== tag)
    });
  };

  const handleSave = async () => {
    if (!expense.amount || parseFloat(expense.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!expense.description.trim()) {
      toast.error('Please add a description');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...expense,
        amount: parseFloat(expense.amount)
      });
      toast.success('Expense logged! 💸');
    } catch (error) {
      toast.error('Failed to save expense');
      setSaving(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === expense.category);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-400" />
            {initialExpense ? 'Edit' : 'Log'} Expense
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Date & Amount */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Date *</Label>
              <Input
                type="date"
                value={expense.date}
                onChange={(e) => setExpense({ ...expense, date: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white pl-7"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="text-white mb-3 block">Category *</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setExpense({ ...expense, category: cat.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    expense.category === cat.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={expense.category === cat.value ? {
                    backgroundColor: `${cat.color}20`,
                    borderColor: cat.color
                  } : {}}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-white text-xs font-bold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-white mb-2 block">Description *</Label>
            <Input
              value={expense.description}
              onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              placeholder="What did you buy?"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-white mb-3 block">Payment Method</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.value}
                  onClick={() => setExpense({ ...expense, paymentMethod: method.value })}
                  className={`p-3 rounded-lg border transition-all ${
                    expense.paymentMethod === method.value
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xl mb-1">{method.emoji}</div>
                  <div className="text-xs font-bold">{method.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-white mb-2 block">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add custom tags..."
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={addTag}
                size="sm"
                className="bg-purple-500/20 text-purple-400 border border-purple-500/40"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {expense.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {expense.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <div className="text-white font-medium">Recurring Expense</div>
              <div className="text-white/60 text-sm">This happens regularly (rent, subscriptions, etc.)</div>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                expense.isRecurring ? 'bg-green-500' : 'bg-white/20'
              }`}
              onClick={() => setExpense({ ...expense, isRecurring: !expense.isRecurring })}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  expense.isRecurring ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-white mb-2 block">Notes (Optional)</Label>
            <Textarea
              value={expense.notes}
              onChange={(e) => setExpense({ ...expense, notes: e.target.value })}
              placeholder="Any additional details..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
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
              {saving ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}