import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Smile, Frown, Meh, Heart, Brain, Coffee, Users, Briefcase, Home, Cloud, Sun, Moon, X, Check } from "lucide-react";

const EMOTIONS = [
  { id: "happy", label: "Happy", icon: "😊", color: "#FFD700" },
  { id: "calm", label: "Calm", icon: "😌", color: "#4CC9F0" },
  { id: "energetic", label: "Energetic", icon: "⚡", color: "#FF5733" },
  { id: "grateful", label: "Grateful", icon: "🙏", color: "#52B788" },
  { id: "anxious", label: "Anxious", icon: "😰", color: "#FF6B35" },
  { id: "stressed", label: "Stressed", icon: "😫", color: "#FF4444" },
  { id: "sad", label: "Sad", icon: "😢", color: "#6B46C1" },
  { id: "angry", label: "Angry", icon: "😠", color: "#DC2626" },
  { id: "tired", label: "Tired", icon: "😴", color: "#94A3B8" },
  { id: "lonely", label: "Lonely", icon: "😔", color: "#7C3AED" },
  { id: "overwhelmed", label: "Overwhelmed", icon: "🤯", color: "#EF4444" },
  { id: "content", label: "Content", icon: "☺️", color: "#10B981" }
];

const TRIGGERS = [
  { id: "work", label: "Work", icon: <Briefcase className="w-4 h-4" /> },
  { id: "relationships", label: "Relationships", icon: <Heart className="w-4 h-4" /> },
  { id: "health", label: "Health", icon: <Brain className="w-4 h-4" /> },
  { id: "sleep", label: "Sleep", icon: <Moon className="w-4 h-4" /> },
  { id: "exercise", label: "Exercise", icon: "💪" },
  { id: "diet", label: "Diet", icon: "🥗" },
  { id: "social", label: "Social", icon: <Users className="w-4 h-4" /> },
  { id: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
  { id: "weather", label: "Weather", icon: <Cloud className="w-4 h-4" /> },
  { id: "finances", label: "Finances", icon: "💰" },
  { id: "news", label: "News/Media", icon: "📰" },
  { id: "caffeine", label: "Caffeine", icon: <Coffee className="w-4 h-4" /> }
];

export default function MoodLogger({ onClose, onSave, initialMood = 50 }) {
  const [moodScore, setMoodScore] = useState(initialMood);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleEmotion = (emotionId) => {
    if (selectedEmotions.includes(emotionId)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotionId));
    } else {
      setSelectedEmotions([...selectedEmotions, emotionId]);
    }
  };

  const toggleTrigger = (triggerId) => {
    if (selectedTriggers.includes(triggerId)) {
      setSelectedTriggers(selectedTriggers.filter(t => t !== triggerId));
    } else {
      setSelectedTriggers([...selectedTriggers, triggerId]);
    }
  };

  const getMoodEmoji = () => {
    if (moodScore >= 80) return "😄";
    if (moodScore >= 60) return "🙂";
    if (moodScore >= 40) return "😐";
    if (moodScore >= 20) return "😔";
    return "😢";
  };

  const getMoodColor = () => {
    if (moodScore >= 80) return "#10B981";
    if (moodScore >= 60) return "#52B788";
    if (moodScore >= 40) return "#FFD700";
    if (moodScore >= 20) return "#FF6B35";
    return "#DC2626";
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      moodScore,
      emotions: selectedEmotions,
      triggers: selectedTriggers,
      notes
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1628]/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">How are you feeling?</h2>
            <p className="text-white/60 text-sm">Track your mood and emotions</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mood Slider */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-white text-lg font-semibold">Rate your mood</Label>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getMoodEmoji()}</span>
              <span className="text-4xl font-bold" style={{ color: getMoodColor() }}>
                {moodScore}
              </span>
            </div>
          </div>
          
          <input
            type="range"
            min="1"
            max="100"
            value={moodScore}
            onChange={(e) => setMoodScore(parseInt(e.target.value))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #DC2626 0%, 
                #FF6B35 25%, 
                #FFD700 50%, 
                #52B788 75%, 
                #10B981 100%)`,
              accentColor: getMoodColor()
            }}
          />
          
          <div className="flex justify-between text-xs text-white/60 mt-2">
            <span>Very Low</span>
            <span>Neutral</span>
            <span>Very High</span>
          </div>
        </div>

        {/* Emotions */}
        <div className="mb-6">
          <Label className="text-white mb-3 block text-lg font-semibold">
            How would you describe your emotions? (Select all that apply)
          </Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {EMOTIONS.map(emotion => {
              const isSelected = selectedEmotions.includes(emotion.id);
              return (
                <button
                  key={emotion.id}
                  onClick={() => toggleEmotion(emotion.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-white/40 bg-white/10 scale-95'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{emotion.icon}</div>
                  <div className="text-xs text-white font-medium">{emotion.label}</div>
                  {isSelected && (
                    <div className="mt-1">
                      <Check className="w-3 h-3 text-green-400 mx-auto" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Triggers */}
        <div className="mb-6">
          <Label className="text-white mb-3 block text-lg font-semibold">
            What might be affecting your mood?
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TRIGGERS.map(trigger => {
              const isSelected = selectedTriggers.includes(trigger.id);
              return (
                <button
                  key={trigger.id}
                  onClick={() => toggleTrigger(trigger.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[#4CC9F0] bg-[#4CC9F0]/20 text-[#4CC9F0]'
                      : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {typeof trigger.icon === 'string' ? (
                    <span className="text-lg">{trigger.icon}</span>
                  ) : (
                    trigger.icon
                  )}
                  <span className="text-sm font-medium">{trigger.label}</span>
                  {isSelected && <Check className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <Label className="text-white mb-2 block">Additional Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else you'd like to remember about this moment..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            rows={3}
          />
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
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-[#4CC9F0] to-[#7C3AED] text-white font-bold"
            style={{ boxShadow: '0 0 20px rgba(76, 201, 240, 0.4)' }}
          >
            {saving ? 'Saving...' : 'Save Mood Entry'}
          </Button>
        </div>
      </div>
    </div>
  );
}