import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sparkles, Wind, Heart, Clock, Target } from "lucide-react";
import { toast } from "sonner";

const TECHNIQUES = [
  { value: "mindfulness", label: "Mindfulness", emoji: "🧘", color: "#4CC9F0" },
  { value: "breath_focus", label: "Breath Focus", emoji: "🌬️", color: "#52B788" },
  { value: "body_scan", label: "Body Scan", emoji: "✨", color: "#7C3AED" },
  { value: "loving_kindness", label: "Loving Kindness", emoji: "💖", color: "#FF69B4" },
  { value: "visualization", label: "Visualization", emoji: "🌈", color: "#FFD700" },
  { value: "mantra", label: "Mantra", emoji: "🕉️", color: "#9370DB" },
  { value: "walking", label: "Walking", emoji: "🚶", color: "#52B788" },
  { value: "transcendental", label: "Transcendental", emoji: "🌟", color: "#D4AF37" },
  { value: "other", label: "Other", emoji: "🔮", color: "#4CC9F0" }
];

const MOODS = [
  { value: "peaceful", emoji: "😌", color: "#52B788" },
  { value: "energized", emoji: "⚡", color: "#FFD700" },
  { value: "centered", emoji: "🎯", color: "#4CC9F0" },
  { value: "sleepy", emoji: "😴", color: "#9370DB" },
  { value: "restless", emoji: "😰", color: "#FF5733" },
  { value: "grateful", emoji: "🙏", color: "#FF69B4" },
  { value: "neutral", emoji: "😐", color: "#708090" }
];

export default function MeditationLogger({ onClose, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState({
    durationType: "timed",
    duration: 10,
    technique: "mindfulness",
    calmBefore: 5,
    calmAfter: 7,
    focusQuality: 7,
    mood: "peaceful",
    completedFully: true,
    distractions: [],
    insights: "",
    location: "",
    notes: ""
  });

  const [newDistraction, setNewDistraction] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session.duration || session.duration < 1) {
      toast.error("Please enter a valid duration");
      return;
    }

    setIsLoading(true);
    await onSave(session);
    setIsLoading(false);
  };

  const addDistraction = () => {
    if (newDistraction.trim()) {
      setSession({
        ...session,
        distractions: [...(session.distractions || []), newDistraction.trim()]
      });
      setNewDistraction("");
    }
  };

  const removeDistraction = (index) => {
    setSession({
      ...session,
      distractions: session.distractions.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Wind className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Log Meditation</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block">Duration (minutes)</label>
              <Input
                type="number"
                min="1"
                max="120"
                value={session.duration}
                onChange={(e) => setSession({ ...session, duration: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Type</label>
              <Select
                value={session.durationType}
                onValueChange={(value) => setSession({ ...session, durationType: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guided">Guided Session</SelectItem>
                  <SelectItem value="timed">Timed Meditation</SelectItem>
                  <SelectItem value="free">Free-form</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {session.durationType === "guided" && (
            <div>
              <label className="text-white/80 text-sm mb-2 block">Session Name</label>
              <Input
                placeholder="e.g., Morning Mindfulness, Deep Relaxation"
                value={session.guidedSessionName || ""}
                onChange={(e) => setSession({ ...session, guidedSessionName: e.target.value })}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          )}

          <div>
            <label className="text-white/80 text-sm mb-2 block">Technique</label>
            <div className="grid grid-cols-3 gap-2">
              {TECHNIQUES.map(tech => (
                <button
                  key={tech.value}
                  type="button"
                  onClick={() => setSession({ ...session, technique: tech.value })}
                  className={`p-3 rounded-xl border transition-all ${
                    session.technique === tech.value
                      ? 'border-white/40 bg-white/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{tech.emoji}</div>
                  <div className="text-white/90 text-xs">{tech.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/80 text-sm mb-2 flex items-center gap-2">
                Calm Before
                <span className="text-white/60 text-xs">(1-10)</span>
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={session.calmBefore}
                onChange={(e) => setSession({ ...session, calmBefore: parseInt(e.target.value) || 1 })}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 flex items-center gap-2">
                Calm After
                <span className="text-white/60 text-xs">(1-10)</span>
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={session.calmAfter}
                onChange={(e) => setSession({ ...session, calmAfter: parseInt(e.target.value) || 1 })}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm mb-2 flex items-center gap-2">
              Focus Quality
              <span className="text-white/60 text-xs">(1-10)</span>
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={session.focusQuality}
              onChange={(e) => setSession({ ...session, focusQuality: parseInt(e.target.value) || 1 })}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm mb-2 block">Mood After</label>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSession({ ...session, mood: mood.value })}
                  className={`p-2 rounded-xl border transition-all ${
                    session.mood === mood.value
                      ? 'border-white/40 bg-white/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl">{mood.emoji}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm mb-2 block">Distractions (optional)</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g., noise, thoughts, physical discomfort"
                value={newDistraction}
                onChange={(e) => setNewDistraction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDistraction())}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
              <Button type="button" onClick={addDistraction} variant="outline" className="border-white/20">
                Add
              </Button>
            </div>
            {session.distractions?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {session.distractions.map((dist, idx) => (
                  <span key={idx} className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm flex items-center gap-2">
                    {dist}
                    <button type="button" onClick={() => removeDistraction(idx)} className="hover:text-orange-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-white/80 text-sm mb-2 block">Insights (optional)</label>
            <Textarea
              placeholder="Any realizations, peace, or clarity gained..."
              value={session.insights}
              onChange={(e) => setSession({ ...session, insights: e.target.value })}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-24"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="completed"
              checked={session.completedFully}
              onChange={(e) => setSession({ ...session, completedFully: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="completed" className="text-white/80 text-sm cursor-pointer">
              Completed the full session
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
            >
              {isLoading ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}