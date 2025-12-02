import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Users, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const INTERACTION_TYPES = [
  { value: "in_person", label: "In Person", emoji: "👥" },
  { value: "phone_call", label: "Phone", emoji: "📞" },
  { value: "video_call", label: "Video", emoji: "📹" },
  { value: "text_chat", label: "Text/Chat", emoji: "💬" },
  { value: "social_media", label: "Social Media", emoji: "📱" },
  { value: "letter_email", label: "Letter/Email", emoji: "✉️" },
  { value: "quality_time", label: "Quality Time", emoji: "⏰" },
  { value: "other", label: "Other", emoji: "🤝" }
];

const DURATION_OPTIONS = [
  { value: "minutes", label: "Minutes", emoji: "⏱️" },
  { value: "hours", label: "Hours", emoji: "⏰" },
  { value: "half_day", label: "Half Day", emoji: "🌅" },
  { value: "full_day", label: "Full Day", emoji: "☀️" }
];

const MOOD_OPTIONS = [
  { value: "energized", label: "Energized", emoji: "⚡", color: "#52B788" },
  { value: "happy", label: "Happy", emoji: "😊", color: "#FFD700" },
  { value: "content", label: "Content", emoji: "😌", color: "#4CC9F0" },
  { value: "tired", label: "Tired", emoji: "😴", color: "#9370DB" },
  { value: "drained", label: "Drained", emoji: "😔", color: "#808080" }
];

const COMMON_ACTIVITIES = [
  "coffee/meal", "walk", "phone chat", "video call", "game/sport",
  "movie/show", "workout", "hobby", "deep conversation", "celebration"
];

export default function InteractionLogger({ onClose, onSave }) {
  const [interaction, setInteraction] = useState({
    interactionType: "in_person",
    withWhom: "",
    quality: 7,
    duration: "hours",
    activities: [],
    mood: "happy",
    deepened: false,
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [activityInput, setActivityInput] = useState("");

  const addActivity = (activity = activityInput) => {
    if (activity.trim() && !interaction.activities.includes(activity.trim())) {
      setInteraction({
        ...interaction,
        activities: [...interaction.activities, activity.trim()]
      });
      setActivityInput("");
    }
  };

  const removeActivity = (activity) => {
    setInteraction({
      ...interaction,
      activities: interaction.activities.filter(a => a !== activity)
    });
  };

  const handleSave = async () => {
    if (!interaction.withWhom.trim()) {
      toast.error('Please enter who you connected with');
      return;
    }

    setSaving(true);
    try {
      await onSave(interaction);
      toast.success('Interaction logged! 👥');
    } catch (error) {
      toast.error('Failed to save interaction');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-[#FFD700]" />
            Log Interaction
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Who */}
          <div>
            <Label className="text-white mb-2 block">Who did you connect with? *</Label>
            <Input
              value={interaction.withWhom}
              onChange={(e) => setInteraction({ ...interaction, withWhom: e.target.value })}
              placeholder="Name or group (e.g., Sarah, Book Club)"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Interaction Type */}
          <div>
            <Label className="text-white mb-3 block">Type of Interaction *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INTERACTION_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setInteraction({ ...interaction, interactionType: type.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    interaction.interactionType === type.value
                      ? 'bg-[#FFD700]/20 border-[#FFD700]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="text-white text-xs font-bold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Connection Quality *</Label>
              <span className="text-[#FFD700] font-bold text-lg">{interaction.quality}/10</span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setInteraction({ ...interaction, quality: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    interaction.quality === num
                      ? 'bg-[#FFD700] text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>Superficial</span>
              <span>Meaningful</span>
              <span>Deep</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-white mb-3 block">Duration</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DURATION_OPTIONS.map(dur => (
                <button
                  key={dur.value}
                  onClick={() => setInteraction({ ...interaction, duration: dur.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    interaction.duration === dur.value
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{dur.emoji}</div>
                  <div className="text-white text-sm">{dur.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <Label className="text-white mb-3 block">What did you do?</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_ACTIVITIES.map(activity => (
                <button
                  key={activity}
                  onClick={() => addActivity(activity)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all text-sm"
                >
                  {activity}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                placeholder="Add custom activity..."
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={() => addActivity()}
                size="sm"
                className="bg-purple-500/20 text-purple-400 border border-purple-500/40"
              >
                Add
              </Button>
            </div>
            {interaction.activities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interaction.activities.map(activity => (
                  <span
                    key={activity}
                    className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {activity}
                    <button onClick={() => removeActivity(activity)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mood After */}
          <div>
            <Label className="text-white mb-3 block">How do you feel after?</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setInteraction({ ...interaction, mood: mood.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    interaction.mood === mood.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={interaction.mood === mood.value ? {
                    backgroundColor: `${mood.color}20`,
                    borderColor: mood.color
                  } : {}}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <div className="text-white text-xs">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Deepened Relationship */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              <div>
                <div className="text-white font-medium">Deepened Relationship</div>
                <div className="text-white/60 text-sm">Did this strengthen your connection?</div>
              </div>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                interaction.deepened ? 'bg-pink-500' : 'bg-white/20'
              }`}
              onClick={() => setInteraction({ ...interaction, deepened: !interaction.deepened })}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  interaction.deepened ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-white mb-2 block">Memorable Moments</Label>
            <Textarea
              value={interaction.notes}
              onChange={(e) => setInteraction({ ...interaction, notes: e.target.value })}
              placeholder="What made this connection special? Any highlights or funny moments..."
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
              className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Interaction'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}