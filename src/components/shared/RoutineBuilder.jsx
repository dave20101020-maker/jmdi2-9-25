import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function RoutineBuilder({ onClose, onSave, initialRoutine = null }) {
  const [routine, setRoutine] = useState(initialRoutine || {
    routineName: "",
    targetBedtime: "22:00",
    steps: [
      { action: "Turn off screens", duration: 5, timeBefore: 60 },
      { action: "Prepare bedroom", duration: 10, timeBefore: 30 },
      { action: "Read or meditate", duration: 15, timeBefore: 15 }
    ]
  });
  const [saving, setSaving] = useState(false);

  const addStep = () => {
    setRoutine({
      ...routine,
      steps: [...routine.steps, { action: "", duration: 10, timeBefore: 20 }]
    });
  };

  const removeStep = (index) => {
    setRoutine({
      ...routine,
      steps: routine.steps.filter((_, i) => i !== index)
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...routine.steps];
    newSteps[index][field] = field === 'action' ? value : parseInt(value) || 0;
    setRoutine({ ...routine, steps: newSteps });
  };

  const handleSave = async () => {
    if (!routine.routineName.trim()) {
      toast.error('Please give your routine a name');
      return;
    }

    if (routine.steps.length === 0) {
      toast.error('Add at least one step to your routine');
      return;
    }

    const hasEmptySteps = routine.steps.some(s => !s.action.trim());
    if (hasEmptySteps) {
      toast.error('All steps must have a description');
      return;
    }

    setSaving(true);
    try {
      await onSave(routine);
      toast.success('Bedtime routine saved! 🌙');
    } catch (error) {
      toast.error('Failed to save routine');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-blue-400" />
            Build Bedtime Routine
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Routine Name */}
          <div>
            <Label className="text-white mb-2 block">Routine Name *</Label>
            <Input
              value={routine.routineName}
              onChange={(e) => setRoutine({ ...routine, routineName: e.target.value })}
              placeholder="e.g., My Evening Wind Down"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Target Bedtime */}
          <div>
            <Label className="text-white mb-2 block">Target Bedtime *</Label>
            <Input
              type="time"
              value={routine.targetBedtime}
              onChange={(e) => setRoutine({ ...routine, targetBedtime: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Routine Steps</Label>
              <Button
                onClick={addStep}
                size="sm"
                className="bg-blue-500/20 text-blue-400 border border-blue-500/40"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="space-y-3">
              {routine.steps.sort((a, b) => b.timeBefore - a.timeBefore).map((step, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input
                        value={step.action}
                        onChange={(e) => updateStep(idx, 'action', e.target.value)}
                        placeholder="What to do..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Minutes before bed</Label>
                          <Input
                            type="number"
                            value={step.timeBefore}
                            onChange={(e) => updateStep(idx, 'timeBefore', e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Duration (min)</Label>
                          <Input
                            type="number"
                            value={step.duration}
                            onChange={(e) => updateStep(idx, 'duration', e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStep(idx)}
                      className="text-red-400 hover:text-red-300 mt-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
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
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Routine'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}