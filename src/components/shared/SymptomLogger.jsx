import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, AlertCircle, Activity, Clock } from "lucide-react";
import { toast } from "sonner";

const COMMON_SYMPTOMS = [
  "headache", "fatigue", "nausea", "dizziness", "pain", 
  "fever", "cough", "congestion", "stomach ache", "muscle pain"
];

const COMMON_TRIGGERS = [
  "stress", "lack of sleep", "food", "weather", "exercise",
  "dehydration", "medication", "allergies", "hormones", "alcohol"
];

const BODY_PARTS = [
  "head", "neck", "shoulders", "back", "chest", "abdomen",
  "arms", "hands", "legs", "feet", "joints", "muscles"
];

const DURATION_OPTIONS = [
  { value: "minutes", label: "Minutes", emoji: "⏱️" },
  { value: "hours", label: "Hours", emoji: "⏰" },
  { value: "ongoing", label: "Ongoing", emoji: "🔄" },
  { value: "days", label: "Days", emoji: "📅" }
];

const RELIEF_OPTIONS = [
  "rest", "medication", "water", "food", "massage",
  "heat", "cold", "stretching", "breathing", "time"
];

export default function SymptomLogger({ onClose, onSave }) {
  const [symptom, setSymptom] = useState({
    symptomType: "",
    bodyPart: "",
    severity: 5,
    triggers: [],
    duration: "hours",
    notes: "",
    relievedBy: []
  });
  const [saving, setSaving] = useState(false);
  const [customSymptom, setCustomSymptom] = useState("");
  const [customTrigger, setCustomTrigger] = useState("");

  const toggleTrigger = (trigger) => {
    const current = symptom.triggers || [];
    if (current.includes(trigger)) {
      setSymptom({ ...symptom, triggers: current.filter(t => t !== trigger) });
    } else {
      setSymptom({ ...symptom, triggers: [...current, trigger] });
    }
  };

  const toggleRelief = (relief) => {
    const current = symptom.relievedBy || [];
    if (current.includes(relief)) {
      setSymptom({ ...symptom, relievedBy: current.filter(r => r !== relief) });
    } else {
      setSymptom({ ...symptom, relievedBy: [...current, relief] });
    }
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim()) {
      setSymptom({ ...symptom, symptomType: customSymptom.trim() });
      setCustomSymptom("");
    }
  };

  const addCustomTrigger = () => {
    if (customTrigger.trim()) {
      setSymptom({ ...symptom, triggers: [...(symptom.triggers || []), customTrigger.trim()] });
      setCustomTrigger("");
    }
  };

  const handleSave = async () => {
    if (!symptom.symptomType.trim()) {
      toast.error('Please select or enter a symptom');
      return;
    }

    setSaving(true);
    try {
      await onSave(symptom);
      toast.success('Symptom logged 📝');
    } catch (error) {
      toast.error('Failed to save symptom');
      setSaving(false);
    }
  };

  const severityColor = symptom.severity <= 3 ? '#52B788' :
                        symptom.severity <= 6 ? '#FFD700' : '#FF5733';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-orange-400" />
            Log Symptom
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Symptom Type */}
          <div>
            <Label className="text-white mb-3 block">What are you experiencing? *</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_SYMPTOMS.map(sym => (
                <button
                  key={sym}
                  onClick={() => setSymptom({ ...symptom, symptomType: sym })}
                  className={`px-3 py-2 rounded-lg border transition-all capitalize text-sm ${
                    symptom.symptomType === sym
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                placeholder="Or type custom symptom..."
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={addCustomSymptom}
                size="sm"
                className="bg-orange-500/20 text-orange-400 border border-orange-500/40"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Body Part */}
          <div>
            <Label className="text-white mb-3 block">Body Part (if applicable)</Label>
            <div className="flex flex-wrap gap-2">
              {BODY_PARTS.map(part => (
                <button
                  key={part}
                  onClick={() => setSymptom({ ...symptom, bodyPart: part })}
                  className={`px-3 py-2 rounded-lg border transition-all capitalize text-sm ${
                    symptom.bodyPart === part
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Severity *</Label>
              <span className="font-bold text-lg" style={{ color: severityColor }}>
                {symptom.severity}/10
              </span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setSymptom({ ...symptom, severity: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    symptom.severity === num
                      ? 'text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  style={symptom.severity === num ? { 
                    backgroundColor: severityColor
                  } : {}}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-white mb-3 block">Duration</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DURATION_OPTIONS.map(dur => (
                <button
                  key={dur.value}
                  onClick={() => setSymptom({ ...symptom, duration: dur.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    symptom.duration === dur.value
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{dur.emoji}</div>
                  <div className="text-white text-sm">{dur.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <Label className="text-white mb-3 block">Possible Triggers</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_TRIGGERS.map(trigger => (
                <button
                  key={trigger}
                  onClick={() => toggleTrigger(trigger)}
                  className={`px-3 py-2 rounded-lg border transition-all capitalize text-sm ${
                    symptom.triggers?.includes(trigger)
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {trigger}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customTrigger}
                onChange={(e) => setCustomTrigger(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTrigger()}
                placeholder="Add custom trigger..."
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={addCustomTrigger}
                size="sm"
                className="bg-red-500/20 text-red-400 border border-red-500/40"
              >
                Add
              </Button>
            </div>
          </div>

          {/* What Helped */}
          <div>
            <Label className="text-white mb-3 block">What helped relieve it?</Label>
            <div className="flex flex-wrap gap-2">
              {RELIEF_OPTIONS.map(relief => (
                <button
                  key={relief}
                  onClick={() => toggleRelief(relief)}
                  className={`px-3 py-2 rounded-lg border transition-all capitalize text-sm ${
                    symptom.relievedBy?.includes(relief)
                      ? 'bg-green-500/20 border-green-500/40 text-green-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {relief}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-white mb-2 block">Additional Notes</Label>
            <Textarea
              value={symptom.notes}
              onChange={(e) => setSymptom({ ...symptom, notes: e.target.value })}
              placeholder="Any other details about this symptom..."
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
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Symptom'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}