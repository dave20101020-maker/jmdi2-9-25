import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, CheckCircle2, Award, Dumbbell } from "lucide-react";
import { toast } from "sonner";

export default function WorkoutTracker({ template, onClose, onSave, personalBests = [] }) {
  const [duration, setDuration] = useState(template.duration || 30);
  const [intensity, setIntensity] = useState("moderate");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState(
    template.exercises.map(ex => ({
      name: ex.name,
      targetSets: ex.sets || 1,
      targetReps: ex.reps,
      targetDuration: ex.duration,
      sets: Array(ex.sets || 1).fill().map(() => ({
        weight: 0,
        reps: ex.reps || 0,
        completed: false
      })),
      notes: ""
    }))
  );
  const [saving, setSaving] = useState(false);
  const [newPRs, setNewPRs] = useState([]);

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    const newExercises = [...exercises];
    newExercises[exerciseIdx].sets[setIdx][field] = field === 'completed' ? value : parseFloat(value) || 0;
    setExercises(newExercises);

    // Check for new PR
    if (field === 'weight' || field === 'reps') {
      const exercise = newExercises[exerciseIdx];
      const set = exercise.sets[setIdx];
      
      if (set.weight > 0 && set.reps > 0) {
        const existingPR = personalBests.find(pb => pb.exerciseName === exercise.name);
        const oneRepMax = set.weight * (1 + set.reps / 30);
        
        if (!existingPR || oneRepMax > (existingPR.oneRepMax || 0)) {
          const prExists = newPRs.some(pr => pr.exercise === exercise.name);
          if (!prExists) {
            setNewPRs([...newPRs, {
              exercise: exercise.name,
              weight: set.weight,
              reps: set.reps
            }]);
          }
        }
      }
    }
  };

  const toggleSetComplete = (exerciseIdx, setIdx) => {
    const newExercises = [...exercises];
    newExercises[exerciseIdx].sets[setIdx].completed = !newExercises[exerciseIdx].sets[setIdx].completed;
    setExercises(newExercises);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        templateName: template.name,
        duration,
        intensity,
        notes,
        exercises: exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          notes: ex.notes
        })),
        personalBests: newPRs
      });
      
      if (newPRs.length > 0) {
        toast.success(`🏆 ${newPRs.length} new personal best${newPRs.length > 1 ? 's' : ''}!`);
      } else {
        toast.success('Workout saved! 💪');
      }
    } catch (error) {
      toast.error('Failed to save workout');
      setSaving(false);
    }
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = exercises.reduce((sum, ex) => 
    sum + ex.sets.filter(s => s.completed).length, 0
  );
  const progress = Math.round((completedSets / totalSets) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-7 h-7 text-[#FF5733]" />
              {template.name}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-white/60">{completedSets}/{totalSets} sets</span>
              <span className="text-[#FF5733] font-bold">{progress}%</span>
              {newPRs.length > 0 && (
                <span className="px-2 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full text-[#D4AF37] text-xs font-bold">
                  {newPRs.length} PR{newPRs.length > 1 ? 's' : ''}! 🏆
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Workout Progress</span>
              <span className="text-[#FF5733] font-bold">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF5733] to-[#FF8C66] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Workout Settings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Actual Duration (min)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Intensity</Label>
              <div className="grid grid-cols-3 gap-2">
                {['light', 'moderate', 'intense'].map(level => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`py-2 rounded-lg font-bold transition-all capitalize text-sm ${
                      intensity === level
                        ? 'bg-[#FF5733] text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            {exercises.map((exercise, exIdx) => {
              const exercisePR = personalBests.find(pb => pb.exerciseName === exercise.name);
              const hasNewPR = newPRs.some(pr => pr.exercise === exercise.name);

              return (
                <div key={exIdx} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-bold flex items-center gap-2">
                        {exercise.name}
                        {hasNewPR && <Award className="w-4 h-4 text-[#D4AF37]" />}
                      </h4>
                      {exercisePR && (
                        <div className="text-xs text-white/60 mt-1">
                          Current PR: {exercisePR.weight}kg × {exercisePR.reps} reps
                        </div>
                      )}
                    </div>
                    <div className="text-white/60 text-sm">
                      {exercise.targetSets} × {exercise.targetReps || `${exercise.targetDuration}s`}
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIdx) => (
                      <div key={setIdx} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSetComplete(exIdx, setIdx)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            set.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-white/30 hover:border-white/50'
                          }`}
                        >
                          {set.completed && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </button>

                        <span className="text-white/60 text-sm w-12">Set {setIdx + 1}</span>

                        {exercise.targetReps ? (
                          <>
                            <Input
                              type="number"
                              placeholder="Weight"
                              value={set.weight || ''}
                              onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                              className="bg-white/10 border-white/20 text-white w-24 text-center"
                            />
                            <span className="text-white/40 text-sm">kg</span>
                            <span className="text-white/40">×</span>
                            <Input
                              type="number"
                              placeholder="Reps"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                              className="bg-white/10 border-white/20 text-white w-20 text-center"
                            />
                            <span className="text-white/40 text-sm">reps</span>
                          </>
                        ) : (
                          <div className="text-white/60 text-sm">
                            {exercise.targetDuration}s duration
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-white mb-2 block">Workout Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the workout feel? Any observations..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
          </div>

          {/* New PRs Alert */}
          {newPRs.length > 0 && (
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="text-white font-bold">New Personal Bests!</h4>
              </div>
              <ul className="space-y-1">
                {newPRs.map((pr, idx) => (
                  <li key={idx} className="text-white/80 text-sm">
                    🏆 {pr.exercise}: {pr.weight}kg × {pr.reps} reps
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              disabled={saving || completedSets === 0}
              className="flex-1 bg-gradient-to-r from-[#FF5733] to-[#FF8C66] text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Complete Workout'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}