import { api } from "@/utils/apiClient";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, BookOpen, Sparkles, RefreshCw, Smile, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const PROMPT_CATEGORIES = [
  { value: "gratitude", label: "Gratitude", emoji: "🙏", color: "#52B788" },
  { value: "reflection", label: "Reflection", emoji: "🤔", color: "#4CC9F0" },
  { value: "goals", label: "Goals", emoji: "🎯", color: "#FFD700" },
  { value: "emotions", label: "Emotions", emoji: "💭", color: "#7C3AED" },
  { value: "growth", label: "Growth", emoji: "🌱", color: "#52B788" },
  { value: "challenges", label: "Challenges", emoji: "⚡", color: "#FF5733" }
];

export default function GuidedJournal({ onClose, onSave }) {
  const [entry, setEntry] = useState({
    prompt: "",
    response: "",
    mood: 7,
    tags: []
  });
  const [selectedCategory, setSelectedCategory] = useState("gratitude");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Voice input hook
  const { isListening, isSupported: voiceSupported, transcript, startListening, stopListening } = useVoiceInput();

  useEffect(() => {
    generatePrompt(selectedCategory);
  }, []);

  // Update entry with voice transcript
  useEffect(() => {
    if (transcript) {
      setEntry(prev => ({ ...prev, response: transcript }));
    }
  }, [transcript]);

  // Handle ESC key and focus trap
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleKeyDown = (e) => {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const generatePrompt = async (category) => {
    setGenerating(true);
    try {
      const categoryPrompts = {
        gratitude: "Create a thoughtful gratitude journaling prompt that helps someone appreciate the positive aspects of their life today.",
        reflection: "Create a reflective journaling prompt that encourages deep self-awareness and understanding of today's experiences.",
        goals: "Create an inspiring journaling prompt about setting intentions or reflecting on personal goals and aspirations.",
        emotions: "Create a journaling prompt that helps someone explore and understand their current emotions in a healthy way.",
        growth: "Create a growth-focused journaling prompt about learning from experiences and personal development.",
        challenges: "Create a supportive journaling prompt that helps someone process and find perspective on current challenges."
      };

      const result = await api.aiCoach({
        prompt: `${categoryPrompts[category]}
        
Return ONLY a single thoughtful, open-ended question (1-2 sentences max) that invites deep reflection. Make it warm and supportive. Do not include any prefix like "Prompt:" or formatting.`,
        response_json_schema: {
          type: "object",
          properties: {
            prompt: { type: "string" }
          }
        }
      });

      setEntry({ ...entry, prompt: result.prompt, tags: [category] });
      setGenerating(false);
    } catch (error) {
      console.error('Error generating prompt:', error);
      setGenerating(false);
      
      // Fallback prompts
      const fallbacks = {
        gratitude: "What are three things that brought you joy or comfort today, and why were they meaningful?",
        reflection: "What did you learn about yourself today?",
        goals: "What small step can you take tomorrow toward something that matters to you?",
        emotions: "What emotion are you feeling most strongly right now, and what might it be telling you?",
        growth: "What's one challenge you've overcome recently, and what did it teach you?",
        challenges: "What's weighing on your mind right now, and what support do you need?"
      };
      
      setEntry({ ...entry, prompt: fallbacks[category], tags: [category] });
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    generatePrompt(category);
  };

  const handleSave = async () => {
    if (!entry.response.trim()) {
      toast.error('Please write something before saving');
      return;
    }

    setSaving(true);
    try {
      await onSave(entry);
      toast.success('Journal entry saved! 📝');
    } catch (error) {
      toast.error('Failed to save entry');
      setSaving(false);
    }
  };

  return (
    <div 
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-labelledby="journal-title"
        aria-modal="true"
        className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 id="journal-title" className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[#4CC9F0]" aria-hidden="true" />
            Guided Journaling
          </h2>
          <button 
            onClick={onClose} 
            className="text-white/60 hover:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close journal (press Escape)"
            title="Close (Escape)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <Label id="category-label" className="text-white mb-3 block">Choose a focus</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3" role="group" aria-labelledby="category-label">
              {PROMPT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  disabled={generating}
                  aria-label={`${cat.label} ${selectedCategory === cat.value ? '(selected)' : ''}`}
                  className={`p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-white ${\n                    selectedCategory === cat.value\n                      ? 'border-2 scale-105'\n                      : 'bg-white/5 border-white/10 hover:bg-white/10'\n                  }`}
                  style={selectedCategory === cat.value ? {\n                    backgroundColor: `${cat.color}20`,\n                    borderColor: cat.color\n                  } : {}}
                >
                  <div className="text-3xl mb-1" aria-hidden="true">{cat.emoji}</div>
                  <div className="text-white text-sm font-bold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI-Generated Prompt */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" aria-hidden="true" />
                Today's Prompt
              </h3>
              <Button
                onClick={() => generatePrompt(selectedCategory)}
                disabled={generating}
                size="sm"
                aria-label="Generate a new prompt"
                className="bg-purple-500/20 text-purple-400 border border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'New Prompt'}
              </Button>
            </div>
            
            {generating ? (
              <div className="text-white/60 italic animate-pulse">Crafting a thoughtful prompt for you...</div>
            ) : (
              <p className="text-white text-lg leading-relaxed italic">"{entry.prompt}"</p>
            )}
          </div>

          {/* Journal Entry */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="journal-input" className="text-white block">Your Response <span aria-label="required">*</span></Label>
              {voiceSupported && (
                <Button
                  type="button"
                  size="sm"
                  variant={isListening ? 'destructive' : 'outline'}
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center gap-2 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                  aria-pressed={isListening}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Voice Input</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {isListening && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-white/80">Recording...</span>
                </div>
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              id="journal-input"
              value={entry.response}
              onChange={(e) => setEntry({ ...entry, response: e.target.value })}
              placeholder="Take your time... there's no wrong answer. Write whatever comes to mind. You can also use the Voice Input button to dictate."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-[#4CC9F0]"
              rows={8}
              aria-label="Journal response text"
              aria-describedby="char-count"
            />
            <div id="char-count" className="text-white/60 text-xs mt-2">
              {entry.response.length} characters
            </div>
          </div>

          {/* Mood After Journaling */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label id="mood-label" className="text-white flex items-center gap-2">
                <Smile className="w-4 h-4" aria-hidden="true" />
                How do you feel after writing?
              </Label>
              <span className="text-[#4CC9F0] font-bold text-lg" aria-live="polite">{entry.mood}/10</span>
            </div>
            <div className="flex gap-1 md:gap-2" role="group" aria-labelledby="mood-label">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setEntry({ ...entry, mood: num })}
                  aria-label={`Mood ${num} out of 10${entry.mood === num ? ' (selected)' : ''}`}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-white ${\n                    entry.mood === num\n                      ? 'bg-[#4CC9F0] text-white scale-110'\n                      : 'bg-white/10 text-white/60 hover:bg-white/20'\n                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white/70 text-sm">
              💡 <strong>Tip:</strong> Journaling regularly can reduce stress, improve mood, and enhance self-awareness. Try to write for at least 5 minutes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              aria-label="Cancel and close journal"
              className="flex-1 border-white/20 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              aria-label={saving ? 'Saving entry' : 'Save journal entry'}
              className="flex-1 bg-gradient-to-r from-[#4CC9F0] to-[#5EE0FF] text-white font-bold focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
