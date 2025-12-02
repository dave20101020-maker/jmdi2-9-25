import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Pill, Plus, Trash2, Clock, Calendar, Bell } from "lucide-react";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "medication", label: "Medication", emoji: "💊", color: "#4CC9F0" },
  { value: "supplement", label: "Supplement", emoji: "🧪", color: "#52B788" },
  { value: "vitamin", label: "Vitamin", emoji: "🌟", color: "#FFD700" }
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily", times: 1 },
  { value: "twice_daily", label: "Twice Daily", times: 2 },
  { value: "three_times_daily", label: "3× Daily", times: 3 },
  { value: "weekly", label: "Weekly", times: 1 },
  { value: "as_needed", label: "As Needed", times: 0 }
];

export default function MedicationTracker({ onClose, onSave, initialMed = null }) {
  const [medication, setMedication] = useState(initialMed || {
    name: "",
    type: "medication",
    dosage: "",
    frequency: "daily",
    times: ["09:00"],
    withFood: false,
    reminderEnabled: true,
    purpose: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  const updateTimes = (frequency) => {
    const freqOption = FREQUENCY_OPTIONS.find(f => f.value === frequency);
    const timesCount = freqOption?.times || 1;
    
    let defaultTimes = [];
    if (frequency === "daily") defaultTimes = ["09:00"];
    else if (frequency === "twice_daily") defaultTimes = ["09:00", "21:00"];
    else if (frequency === "three_times_daily") defaultTimes = ["08:00", "14:00", "20:00"];
    else if (frequency === "weekly") defaultTimes = ["09:00"];
    
    setMedication({ ...medication, frequency, times: defaultTimes });
  };

  const updateTime = (index, value) => {
    const newTimes = [...medication.times];
    newTimes[index] = value;
    setMedication({ ...medication, times: newTimes });
  };

  const handleSave = async () => {
    if (!medication.name.trim()) {
      toast.error('Please enter medication name');
      return;
    }

    setSaving(true);
    try {
      await onSave(medication);
      toast.success('Medication saved! 💊');
    } catch (error) {
      toast.error('Failed to save medication');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Pill className="w-7 h-7 text-[#4CC9F0]" />
            {initialMed ? 'Edit' : 'Add'} Medication
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type */}
          <div>
            <Label className="text-white mb-3 block">Type *</Label>
            <div className="grid grid-cols-3 gap-3">
              {TYPE_OPTIONS.map(type => (
                <button
                  key={type.value}
                  onClick={() => setMedication({ ...medication, type: type.value })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    medication.type === type.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={medication.type === type.value ? {
                    backgroundColor: `${type.color}20`,
                    borderColor: type.color
                  } : {}}
                >
                  <div className="text-3xl mb-1">{type.emoji}</div>
                  <div className="text-white text-sm font-bold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Dosage */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Name *</Label>
              <Input
                value={medication.name}
                onChange={(e) => setMedication({ ...medication, name: e.target.value })}
                placeholder="e.g., Vitamin D3"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Dosage</Label>
              <Input
                value={medication.dosage}
                onChange={(e) => setMedication({ ...medication, dosage: e.target.value })}
                placeholder="e.g., 500mg, 1 tablet"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <Label className="text-white mb-3 block">Frequency *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FREQUENCY_OPTIONS.map(freq => (
                <button
                  key={freq.value}
                  onClick={() => updateTimes(freq.value)}
                  className={`p-3 rounded-xl border transition-all ${
                    medication.frequency === freq.value
                      ? 'bg-[#4CC9F0]/20 border-[#4CC9F0] text-[#4CC9F0]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold text-sm">{freq.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          {medication.frequency !== "as_needed" && (
            <div>
              <Label className="text-white mb-3 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reminder Times
              </Label>
              <div className="space-y-2">
                {medication.times.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/40" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(idx, e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* With Food Toggle */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <div className="text-white font-medium">Take with food</div>
              <div className="text-white/60 text-sm">Should be taken with meals</div>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                medication.withFood ? 'bg-green-500' : 'bg-white/20'
              }`}
              onClick={() => setMedication({ ...medication, withFood: !medication.withFood })}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  medication.withFood ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reminders Toggle */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <div className="text-white font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Enable Reminders
              </div>
              <div className="text-white/60 text-sm">Get notified to take this</div>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                medication.reminderEnabled ? 'bg-blue-500' : 'bg-white/20'
              }`}
              onClick={() => setMedication({ ...medication, reminderEnabled: !medication.reminderEnabled })}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  medication.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Purpose */}
          <div>
            <Label className="text-white mb-2 block">Purpose / Condition</Label>
            <Input
              value={medication.purpose}
              onChange={(e) => setMedication({ ...medication, purpose: e.target.value })}
              placeholder="What is this for?"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-white mb-2 block">Notes</Label>
            <Textarea
              value={medication.notes}
              onChange={(e) => setMedication({ ...medication, notes: e.target.value })}
              placeholder="Doctor's instructions, side effects to watch for, etc..."
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
              className="flex-1 bg-gradient-to-r from-[#4CC9F0] to-[#5EE0FF] text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Medication'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}