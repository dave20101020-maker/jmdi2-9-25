import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

const CATEGORIES = [
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { value: "learning", label: "Learning", emoji: "📚" },
  { value: "creativity", label: "Creativity", emoji: "🎨" },
  { value: "social", label: "Social", emoji: "👥" },
  { value: "health", label: "Health", emoji: "❤️" },
  { value: "productivity", label: "Productivity", emoji: "⚡" },
  { value: "other", label: "Other", emoji: "🎯" }
];

export default function ChallengeForm({ onClose, onSave, user }) {
  const [challenge, setChallenge] = useState({
    title: "",
    description: "",
    category: "fitness",
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    goal: "",
    targetValue: "",
    unit: "",
    emoji: "💪",
    isPublic: true
  });
  const [saving, setSaving] = useState(false);

  const handleCategoryChange = (category) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    setChallenge({
      ...challenge,
      category,
      emoji: categoryData.emoji
    });
  };

  const handleSave = async () => {
    if (!challenge.title.trim()) {
      toast.error('Please enter a challenge title');
      return;
    }

    if (!challenge.description.trim()) {
      toast.error('Please add a description');
      return;
    }

    if (new Date(challenge.endDate) <= new Date(challenge.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...challenge,
        participants: [{
          email: user.email,
          name: user.full_name,
          joinedDate: format(new Date(), 'yyyy-MM-dd'),
          progress: 0
        }],
        updates: [],
        targetValue: challenge.targetValue ? parseFloat(challenge.targetValue) : null
      });
      toast.success('Challenge created! 🎉');
    } catch (error) {
      toast.error('Failed to create challenge');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-[#FFD700]" />
            Create Challenge
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label className="text-white mb-2 block">Challenge Title *</Label>
            <Input
              value={challenge.title}
              onChange={(e) => setChallenge({ ...challenge, title: e.target.value })}
              placeholder="e.g., 30-Day Fitness Challenge"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-white mb-2 block">Description *</Label>
            <Textarea
              value={challenge.description}
              onChange={(e) => setChallenge({ ...challenge, description: e.target.value })}
              placeholder="What's the challenge about? What will participants do?"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
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
                    challenge.category === cat.value
                      ? 'bg-[#FFD700]/20 border-[#FFD700]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-white text-xs font-bold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Start Date *</Label>
              <Input
                type="date"
                value={challenge.startDate}
                onChange={(e) => setChallenge({ ...challenge, startDate: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">End Date *</Label>
              <Input
                type="date"
                value={challenge.endDate}
                onChange={(e) => setChallenge({ ...challenge, endDate: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                min={challenge.startDate}
              />
            </div>
          </div>

          {/* Goal */}
          <div>
            <Label className="text-white mb-2 block">Goal</Label>
            <Input
              value={challenge.goal}
              onChange={(e) => setChallenge({ ...challenge, goal: e.target.value })}
              placeholder="e.g., Exercise 5 days per week"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Target & Unit */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Target Value (Optional)</Label>
              <Input
                type="number"
                value={challenge.targetValue}
                onChange={(e) => setChallenge({ ...challenge, targetValue: e.target.value })}
                placeholder="e.g., 30"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Unit</Label>
              <Input
                value={challenge.unit}
                onChange={(e) => setChallenge({ ...challenge, unit: e.target.value })}
                placeholder="e.g., days, workouts, hours"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <div className="text-white font-medium">Public Challenge</div>
              <div className="text-white/60 text-sm">Let anyone join this challenge</div>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                challenge.isPublic ? 'bg-green-500' : 'bg-white/20'
              }`}
              onClick={() => setChallenge({ ...challenge, isPublic: !challenge.isPublic })}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  challenge.isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
              className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}