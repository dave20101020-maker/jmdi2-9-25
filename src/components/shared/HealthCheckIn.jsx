import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  X,
  Save,
  Heart,
  Activity,
  Utensils,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DIGESTION_OPTIONS = [
  { value: "good", emoji: "✅", label: "Good" },
  { value: "fair", emoji: "👍", label: "Fair" },
  { value: "poor", emoji: "⚠️", label: "Poor" },
];

const CONCERN_LEVELS = [
  { value: "none", label: "No Concerns", color: "#52B788", emoji: "😊" },
  { value: "minor", label: "Minor", color: "#FFD700", emoji: "🤔" },
  { value: "moderate", label: "Moderate", color: "#FF8C66", emoji: "😟" },
  {
    value: "needs_attention",
    label: "Needs Attention",
    color: "#FF5733",
    emoji: "⚠️",
  },
];

export default function HealthCheckIn({ onClose, onSave }) {
  const [checkIn, setCheckIn] = useState({
    energyLevel: 7,
    painLevel: 0,
    digestion: "good",
    currentSymptoms: [],
    exerciseCompleted: false,
    notes: "",
    concernLevel: "none",
  });
  const [saving, setSaving] = useState(false);
  const [symptomInput, setSymptomInput] = useState("");

  const addSymptom = () => {
    if (symptomInput.trim()) {
      setCheckIn({
        ...checkIn,
        currentSymptoms: [
          ...(checkIn.currentSymptoms || []),
          symptomInput.trim(),
        ],
      });
      setSymptomInput("");
    }
  };

  const removeSymptom = (index) => {
    setCheckIn({
      ...checkIn,
      currentSymptoms: checkIn.currentSymptoms.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(checkIn);
      toast.success("Health check-in saved! ❤️");
    } catch (error) {
      toast.error("Failed to save check-in");
      setSaving(false);
    }
  };

  const energyColor =
    checkIn.energyLevel >= 7
      ? "#52B788"
      : checkIn.energyLevel >= 4
      ? "#FFD700"
      : "#FF5733";
  const painColor =
    checkIn.painLevel === 0
      ? "#52B788"
      : checkIn.painLevel <= 3
      ? "#FFD700"
      : "#FF5733";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-7 h-7 text-[#FF7F50]" />
            Daily Health Check-In
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Energy Level */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Energy Level *
              </Label>
              <span
                className="font-bold text-lg"
                style={{ color: energyColor }}
              >
                {checkIn.energyLevel}/10
              </span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setCheckIn({ ...checkIn, energyLevel: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    checkIn.energyLevel === num
                      ? "text-white scale-110"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                  style={
                    checkIn.energyLevel === num
                      ? {
                          backgroundColor: energyColor,
                        }
                      : {}
                  }
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>Exhausted</span>
              <span>Moderate</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Pain Level */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Pain Level</Label>
              <span className="font-bold text-lg" style={{ color: painColor }}>
                {checkIn.painLevel}/10
              </span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setCheckIn({ ...checkIn, painLevel: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    checkIn.painLevel === num
                      ? "text-white scale-110"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                  style={
                    checkIn.painLevel === num
                      ? {
                          backgroundColor: painColor,
                        }
                      : {}
                  }
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>No Pain</span>
              <span>Worst Pain</span>
            </div>
          </div>

          {/* Digestion */}
          <div>
            <Label className="text-white mb-3 block flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Digestion
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {DIGESTION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setCheckIn({ ...checkIn, digestion: option.value })
                  }
                  className={`p-4 rounded-xl border-2 transition-all ${
                    checkIn.digestion === option.value
                      ? "bg-[#52B788]/20 border-[#52B788]"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-white text-sm">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Symptoms */}
          <div>
            <Label className="text-white mb-2 block">Current Symptoms</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSymptom()}
                placeholder="Add any symptoms..."
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={addSymptom}
                size="sm"
                className="bg-orange-500/20 text-orange-400 border border-orange-500/40"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {checkIn.currentSymptoms?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {checkIn.currentSymptoms.map((symptom, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {symptom}
                    <button
                      onClick={() => removeSymptom(idx)}
                      className="hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Exercise Completed */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <div className="text-white font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Exercised today
              </div>
              <div className="text-white/60 text-sm">
                Did you do any physical activity?
              </div>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checkIn.exerciseCompleted ? "bg-green-500" : "bg-white/20"
              }`}
              onClick={() =>
                setCheckIn({
                  ...checkIn,
                  exerciseCompleted: !checkIn.exerciseCompleted,
                })
              }
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  checkIn.exerciseCompleted ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Concern Level */}
          <div>
            <Label className="text-white mb-3 block">
              Overall Concern Level
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {CONCERN_LEVELS.map((concern) => (
                <button
                  key={concern.value}
                  onClick={() =>
                    setCheckIn({ ...checkIn, concernLevel: concern.value })
                  }
                  className={`p-4 rounded-xl border-2 transition-all ${
                    checkIn.concernLevel === concern.value
                      ? "border-2 scale-105"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                  style={
                    checkIn.concernLevel === concern.value
                      ? {
                          backgroundColor: `${concern.color}20`,
                          borderColor: concern.color,
                        }
                      : {}
                  }
                >
                  <div className="text-2xl mb-1">{concern.emoji}</div>
                  <div className="text-white text-sm font-bold">
                    {concern.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-white mb-2 block">Notes</Label>
            <Textarea
              value={checkIn.notes}
              onChange={(e) =>
                setCheckIn({ ...checkIn, notes: e.target.value })
              }
              placeholder="How are you feeling overall? Any health observations..."
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
              className="flex-1 bg-gradient-to-r from-[#FF7F50] to-[#FF9A7A] text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Complete Check-In"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
