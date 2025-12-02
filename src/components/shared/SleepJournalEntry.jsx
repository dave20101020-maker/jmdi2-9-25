import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Moon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DISTURBANCE_OPTIONS = [
  "noise", "bathroom", "nightmares", "pain", "temperature", 
  "partner", "pets", "anxiety", "restlessness", "other"
];

const WOKE_UP_FEELINGS = [
  { value: "refreshed", emoji: "😊", label: "Refreshed" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "groggy", emoji: "🥱", label: "Groggy" },
  { value: "energized", emoji: "⚡", label: "Energized" },
  { value: "restless", emoji: "😣", label: "Restless" }
];

export default function SleepJournalEntry({ onClose, onSave, initialEntry = null }) {
  const [entry, setEntry] = useState(initialEntry || {
    dreams: "",
    disturbances: [],
    sleepQuality: 7,
    wokeUpFeeling: "refreshed",
    notes: "",
    tags: []
  });
  const [saving, setSaving] = useState(false);

  const toggleDisturbance = (disturbance) => {
    const current = entry.disturbances || [];
    if (current.includes(disturbance)) {
      setEntry({ ...entry, disturbances: current.filter(d => d !== disturbance) });
    } else {
      setEntry({ ...entry, disturbances: [...current, disturbance] });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(entry);
      toast.success('Journal entry saved! 🌙');
    } catch (error) {
      toast.error('Failed to save entry');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Moon className="w-7 h-7 text-[#6B46C1]" />
            Sleep Journal
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sleep Quality */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Sleep Quality *</Label>
              <span className="text-[#6B46C1] font-bold text-lg">{entry.sleepQuality}/10</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setEntry({ ...entry, sleepQuality: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${
                    entry.sleepQuality === num
                      ? 'bg-[#6B46C1] text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* How You Woke Up */}
          <div>
            <Label className="text-white mb-3 block">How did you wake up?</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {WOKE_UP_FEELINGS.map(feeling => (
                <button
                  key={feeling.value}
                  onClick={() => setEntry({ ...entry, wokeUpFeeling: feeling.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    entry.wokeUpFeeling === feeling.value
                      ? 'bg-[#6B46C1]/20 border-[#6B46C1]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{feeling.emoji}</div>
                  <div className="text-white text-xs">{feeling.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dreams */}
          <div>
            <Label className="text-white mb-2 block">Dreams (if you remember any)</Label>
            <Textarea
              value={entry.dreams}
              onChange={(e) => setEntry({ ...entry, dreams: e.target.value })}
              placeholder="Describe any dreams you remember..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
          </div>

          {/* Disturbances */}
          <div>
            <Label className="text-white mb-3 block">Sleep Disturbances</Label>
            <div className="flex flex-wrap gap-2">
              {DISTURBANCE_OPTIONS.map(disturbance => (
                <button
                  key={disturbance}
                  onClick={() => toggleDisturbance(disturbance)}
                  className={`px-3 py-2 rounded-lg border transition-all capitalize text-sm ${
                    entry.disturbances?.includes(disturbance)
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {disturbance}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-white mb-2 block">Additional Notes</Label>
            <Textarea
              value={entry.notes}
              onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
              placeholder="Any other observations about your sleep..."
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
              className="flex-1 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white font-bold"
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