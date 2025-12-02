
import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Sparkles, Zap, Target, CheckCircle2, Link } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PILLARS } from '@/utils';

const FREQUENCIES = [
  { value: "daily", label: "Daily", description: "Every day" },
  { value: "workdays", label: "Workdays", description: "Monday - Friday" },
  { value: "weekends", label: "Weekends", description: "Saturday - Sunday" },
  { value: "weekly", label: "Weekly", description: "Once per week" }
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy", emoji: "😊" },
  { value: "medium", label: "Medium", emoji: "💪" },
  { value: "hard", label: "Hard", emoji: "🔥" }
];

const CATEGORIES = [
  { value: "health", label: "Health", icon: "❤️" },
  { value: "productivity", label: "Productivity", icon: "⚡" },
  { value: "mindfulness", label: "Mindfulness", icon: "🧘" },
  { value: "social", label: "Social", icon: "👥" },
  { value: "learning", label: "Learning", icon: "📚" },
  { value: "creativity", label: "Creativity", icon: "🎨" }
];

export default function HabitCreator({ onClose, onSuccess, initialHabit = null, user, linkedPlanId = null, linkedGoalId = null, suggestedPillar = null }) {
  const [habitText, setHabitText] = useState(initialHabit?.habitText || "");
  const [pillar, setPillar] = useState(initialHabit?.pillar || suggestedPillar || "");
  const [frequency, setFrequency] = useState(initialHabit?.frequency || "daily");
  const [difficulty, setDifficulty] = useState(initialHabit?.difficulty || "medium");
  const [category, setCategory] = useState(initialHabit?.category || "health");
  const [reminderTime, setReminderTime] = useState(initialHabit?.reminderTime || "09:00");
  const [reminderEnabled, setReminderEnabled] = useState(initialHabit?.reminderEnabled !== false);
  const [selectedPlanId, setSelectedPlanId] = useState(initialHabit?.linkedPlanId || linkedPlanId || "");
  const [selectedGoalId, setSelectedGoalId] = useState(initialHabit?.linkedGoalId || linkedGoalId || "");
  const [loading, setLoading] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Fetch user's plans and goals
  const { data: plans = [] } = useQuery({
    queryKey: ['lifePlans', user?.email],
    queryFn: () => api.getPlans({ created_by: user?.email, isActive: true }, '-created_date', 50),
    enabled: !!user,
    initialData: []
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['smartGoals', user?.email],
    queryFn: () => api.getGoals({ created_by: user?.email, status: 'active' }, '-created_date', 50),
    enabled: !!user,
    initialData: []
  });

  // Filter plans and goals by selected pillar
  const filteredPlans = pillar ? plans.filter(p => p.pillar === pillar) : plans;
  const filteredGoals = pillar ? goals.filter(g => g.pillar === pillar) : goals;

  const generateHabitIdeas = async () => {
    if (!pillar) {
      alert('Please select a pillar first');
      return;
    }
    
    setGeneratingIdeas(true);
    
    try {
      const pillarInfo = PILLARS[pillar];
      const prompt = `Generate 5 specific, actionable habit ideas for the "${pillarInfo.name}" pillar.

User profile:
${user.bio ? `- Age: ${user.bio.age}, Activity: ${user.bio.activityLevel}` : '- No bio data'}
${user.comb ? `- Motivation: ${user.comb.motivation?.motivationLevel}/5` : ''}

Requirements:
- Make them specific and measurable
- Vary difficulty levels
- Focus on sustainable daily actions
- Keep them concise (under 60 characters)
- Make them achievable for beginners

Return ONLY valid JSON array of strings, no markdown:
["habit 1", "habit 2", "habit 3", "habit 4", "habit 5"]`;

      const result = await api.aiCoach({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            habits: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      setAiSuggestions(result.habits || result.output?.habits || []);
    } catch (error) {
      console.error('Error generating ideas:', error);
      alert('Failed to generate ideas. Please try again.');
    }
    
    setGeneratingIdeas(false);
  };

  const handleSave = async () => {
    if (!habitText.trim()) {
      alert('Please enter a habit description');
      return;
    }
    
    if (!pillar) {
      alert('Please select a pillar');
      return;
    }
    
    setLoading(true);
    
    try {
      const habitData = {
        userId: user.email,
        habitText: habitText.trim(),
        pillar,
        frequency,
        difficulty,
        category,
        reminderTime,
        reminderEnabled,
        isActive: true,
        linkedPlanId: selectedPlanId || null,
        linkedGoalId: selectedGoalId || null
      };

      if (initialHabit) {
        await api.updateHabit(initialHabit.id, habitData);
      } else {
        await api.createHabit(habitData);
      }
      
      // Update linked plan/goal counts
      // Increment count only if a plan is newly linked (either on creation or if it wasn't linked before)
      if (selectedPlanId && (!initialHabit || initialHabit.linkedPlanId !== selectedPlanId)) {
        const plan = plans.find(p => p.id === selectedPlanId);
        if (plan) {
          await api.updatePlan(selectedPlanId, {
            linkedHabitsCount: (plan.linkedHabitsCount || 0) + 1
          });
        }
      }
      
      // Increment count only if a goal is newly linked (either on creation or if it wasn't linked before)
      if (selectedGoalId && (!initialHabit || initialHabit.linkedGoalId !== selectedGoalId)) {
        const goal = goals.find(g => g.id === selectedGoalId);
        if (goal) {
          await api.updateGoal(selectedGoalId, {
            linkedHabitsCount: (goal.linkedHabitsCount || 0) + 1
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving habit:', error);
      alert('Failed to save habit. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1628]/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {initialHabit ? 'Edit Habit' : 'Create New Habit'}
            </h2>
            <p className="text-white/60 text-sm">Build sustainable daily practices</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Habit Text */}
        <div className="mb-6">
          <Label className="text-white mb-2 block text-lg font-semibold">What habit do you want to build?</Label>
          <Input
            value={habitText}
            onChange={(e) => setHabitText(e.target.value)}
            placeholder="e.g., Meditate for 10 minutes, Drink 8 glasses of water"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg"
          />
        </div>

        {/* AI Suggestions */}
        {!initialHabit && (
          <div className="mb-6">
            <Button
              onClick={generateHabitIdeas}
              disabled={!pillar || generatingIdeas}
              variant="outline"
              size="sm"
              className="border-[#F4D03F]/40 text-[#F4D03F] hover:bg-[#F4D03F]/10 mb-3"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingIdeas ? 'Generating Ideas...' : 'Get AI Suggestions'}
            </Button>
            
            {aiSuggestions.length > 0 && (
              <div className="grid gap-2">
                {aiSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHabitText(suggestion)}
                    className="text-left p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white/80 text-sm"
                  >
                    <Zap className="w-3 h-3 inline mr-2 text-[#F4D03F]" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pillar Selection */}
        <div className="mb-6">
          <Label className="text-white mb-3 block text-lg font-semibold">Which pillar does this support?</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(PILLARS).map(([id, p]) => {
              const isSelected = pillar === id;
              return (
                <button
                  key={id}
                  onClick={() => setPillar(id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-white/40 bg-white/10 scale-95'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{p.icon}</div>
                  <div className="text-xs text-white font-medium">{p.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Link to Plan or Goal */}
        <div className="mb-6 bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border border-[#D4AF37]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link className="w-5 h-5 text-[#D4AF37]" />
            <Label className="text-white text-base font-semibold">Link to Plan or Goal (Optional)</Label>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Connect this habit to track progress towards your long-term objectives
          </p>
          
          <div className="space-y-3">
            {/* Link to Plan */}
            <div>
              <Label className="text-white/80 mb-2 block text-sm">📋 Link to Life Plan</Label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">No plan selected</option>
                {filteredPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {PILLARS[plan.pillar]?.icon} {plan.planTitle}
                  </option>
                ))}
              </select>
              {selectedPlanId && (
                <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Completions will contribute to plan progress
                </p>
              )}
            </div>

            {/* Link to Goal */}
            <div>
              <Label className="text-white/80 mb-2 block text-sm">🎯 Link to SMART Goal</Label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">No goal selected</option>
                {filteredGoals.map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.goalStatement}
                  </option>
                ))}
              </select>
              {selectedGoalId && (
                <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Completions will contribute to goal progress
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Frequency */}
        <div className="mb-6">
          <Label className="text-white mb-3 block">Frequency</Label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCIES.map(freq => {
              const isSelected = frequency === freq.value;
              return (
                <button
                  key={freq.value}
                  onClick={() => setFrequency(freq.value)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-[#4CC9F0] bg-[#4CC9F0]/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold text-sm">{freq.label}</div>
                  <div className="text-xs opacity-70">{freq.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty & Category */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="text-white mb-3 block">Difficulty</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(diff => {
                const isSelected = difficulty === diff.value;
                return (
                  <button
                    key={diff.value}
                    onClick={() => setDifficulty(diff.value)}
                    className={`flex-1 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xl mb-1">{diff.emoji}</div>
                    <div className="text-xs font-medium">{diff.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <Label className="text-white mb-3 block">Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reminder */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white">Daily Reminder</Label>
            <button
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                reminderEnabled ? 'bg-[#4CC9F0]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  reminderEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          
          {reminderEnabled && (
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !habitText.trim() || !pillar}
            className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
            style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
          >
            {loading ? 'Saving...' : initialHabit ? 'Update Habit' : 'Create Habit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
