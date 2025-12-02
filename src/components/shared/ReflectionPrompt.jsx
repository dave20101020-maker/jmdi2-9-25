import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Save, BookOpen, Sparkles, RefreshCw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const REFLECTION_TYPES = [
  { value: "daily", label: "Daily", emoji: "☀️", color: "#FFD700" },
  { value: "weekly", label: "Weekly", emoji: "📅", color: "#7C3AED" },
  { value: "monthly", label: "Monthly", emoji: "🌙", color: "#4CC9F0" },
  { value: "custom", label: "Custom", emoji: "✨", color: "#FF69B4" }
];

export default function ReflectionPrompt({ onClose, onSave, reflectionType = "daily" }) {
  const [entry, setEntry] = useState({
    reflectionType,
    prompt: "",
    response: "",
    insights: [],
    gratefulFor: [],
    challenges: [],
    growth: "",
    intentionForward: "",
    meaningScore: 7
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [insightInput, setInsightInput] = useState("");
  const [gratitudeInput, setGratitudeInput] = useState("");
  const [challengeInput, setChallengeInput] = useState("");

  useEffect(() => {
    generatePrompt(reflectionType);
  }, []);

  const generatePrompt = async (type) => {
    setGenerating(true);
    try {
      const typePrompts = {
        daily: "Create a thoughtful daily reflection prompt that helps someone review their day with gratitude, awareness, and intention for tomorrow.",
        weekly: "Create a weekly reflection prompt that encourages someone to review the past week's experiences, growth, and lessons learned.",
        monthly: "Create a monthly reflection prompt that invites deep contemplation of progress, patterns, and alignment with values over the past month.",
        custom: "Create a spiritual reflection prompt that explores meaning, purpose, and connection to something greater."
      };

      const result = await api.aiCoach({
        prompt: `${typePrompts[type]}

Return ONLY a single open-ended, contemplative question that invites deep reflection. Make it warm, spiritual, and thought-provoking. Do not include any prefix.`,
        response_json_schema: {
          type: "object",
          properties: {
            prompt: { type: "string" }
          }
        }
      });

      setEntry({ ...entry, prompt: result.prompt, reflectionType: type });
      setGenerating(false);
    } catch (error) {
      console.error('Error generating prompt:', error);
      setGenerating(false);
      
      const fallbacks = {
        daily: "As you reflect on today, what moment made you feel most alive and connected?",
        weekly: "What lesson did this week teach you about yourself?",
        monthly: "How have you grown in alignment with your deepest values this month?",
        custom: "What brings you a sense of meaning and purpose in your life right now?"
      };
      
      setEntry({ ...entry, prompt: fallbacks[type], reflectionType: type });
    }
  };

  const addItem = (field, input, setInput) => {
    if (input.trim()) {
      setEntry({
        ...entry,
        [field]: [...entry[field], input.trim()]
      });
      setInput("");
    }
  };

  const removeItem = (field, index) => {
    setEntry({
      ...entry,
      [field]: entry[field].filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!entry.response.trim()) {
      toast.error('Please write your reflection');
      return;
    }

    setSaving(true);
    try {
      await onSave(entry);
      toast.success('Reflection saved! 🌟');
    } catch (error) {
      toast.error('Failed to save reflection');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-400" />
            Reflection
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <Label className="text-white mb-3 block">Reflection Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REFLECTION_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    setEntry({ ...entry, reflectionType: type.value });
                    generatePrompt(type.value);
                  }}
                  disabled={generating}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    entry.reflectionType === type.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={entry.reflectionType === type.value ? {
                    backgroundColor: `${type.color}20`,
                    borderColor: type.color
                  } : {}}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="text-white text-sm font-bold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI-Generated Prompt */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Reflection Prompt
              </h3>
              <Button
                onClick={() => generatePrompt(entry.reflectionType)}
                disabled={generating}
                size="sm"
                className="bg-purple-500/20 text-purple-400 border border-purple-500/40"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                New
              </Button>
            </div>
            
            {generating ? (
              <div className="text-white/60 italic animate-pulse">Generating prompt...</div>
            ) : (
              <p className="text-white text-lg leading-relaxed italic">"{entry.prompt}"</p>
            )}
          </div>

          {/* Main Reflection */}
          <div>
            <Label className="text-white mb-2 block">Your Reflection *</Label>
            <Textarea
              value={entry.response}
              onChange={(e) => setEntry({ ...entry, response: e.target.value })}
              placeholder="Take your time... let your thoughts flow naturally..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[150px]"
              rows={6}
            />
          </div>

          {/* Quick Capture Sections */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Grateful For */}
            <div>
              <Label className="text-white mb-2 block text-sm">Grateful For</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={gratitudeInput}
                  onChange={(e) => setGratitudeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('gratefulFor', gratitudeInput, setGratitudeInput)}
                  placeholder="Add..."
                  className="bg-white/10 border-white/20 text-white text-sm flex-1"
                />
                <Button
                  onClick={() => addItem('gratefulFor', gratitudeInput, setGratitudeInput)}
                  size="sm"
                  className="bg-green-500/20 text-green-400 border border-green-500/40"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {entry.gratefulFor.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-green-500/10 rounded-lg p-2 mb-1 text-sm">
                  <span className="text-green-400">•</span>
                  <span className="text-white/80 flex-1">{item}</span>
                  <button onClick={() => removeItem('gratefulFor', idx)} className="text-red-400 hover:text-red-300">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Challenges */}
            <div>
              <Label className="text-white mb-2 block text-sm">Challenges Faced</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={challengeInput}
                  onChange={(e) => setChallengeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('challenges', challengeInput, setChallengeInput)}
                  placeholder="Add..."
                  className="bg-white/10 border-white/20 text-white text-sm flex-1"
                />
                <Button
                  onClick={() => addItem('challenges', challengeInput, setChallengeInput)}
                  size="sm"
                  className="bg-orange-500/20 text-orange-400 border border-orange-500/40"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {entry.challenges.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-orange-500/10 rounded-lg p-2 mb-1 text-sm">
                  <span className="text-orange-400">•</span>
                  <span className="text-white/80 flex-1">{item}</span>
                  <button onClick={() => removeItem('challenges', idx)} className="text-red-400 hover:text-red-300">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Growth & Intention */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block text-sm">Growth/Learning</Label>
              <Textarea
                value={entry.growth}
                onChange={(e) => setEntry({ ...entry, growth: e.target.value })}
                placeholder="What did you learn?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-white mb-2 block text-sm">Intention Forward</Label>
              <Textarea
                value={entry.intentionForward}
                onChange={(e) => setEntry({ ...entry, intentionForward: e.target.value })}
                placeholder="What will you focus on?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm"
                rows={3}
              />
            </div>
          </div>

          {/* Meaning Score */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Sense of Meaning/Purpose</Label>
              <span className="text-purple-400 font-bold text-lg">{entry.meaningScore}/10</span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setEntry({ ...entry, meaningScore: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    entry.meaningScore === num
                      ? 'bg-purple-500 text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {num}
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
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Reflection'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}