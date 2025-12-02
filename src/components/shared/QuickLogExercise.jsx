import { api } from "@/utils/apiClient";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckCircle2, Footprints, Dumbbell, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRESET_WORKOUTS = [
  { 
    minutes: 20, 
    label: 'Walk 20 min', 
    emoji: '🚶', 
    intensity: 'light',
    icon: Footprints,
    color: '#4CC9F0'
  },
  { 
    minutes: 45, 
    label: 'Gym 45 min', 
    emoji: '🏋️', 
    intensity: 'moderate',
    icon: Dumbbell,
    color: '#FF5733'
  },
  { 
    minutes: 30, 
    label: 'Yoga 30 min', 
    emoji: '🧘', 
    intensity: 'light',
    icon: Heart,
    color: '#7C3AED'
  }
];

export default function QuickLogExercise({ onSuccess, yesterdayValue = null, user }) {
  const [selectedWorkout, setSelectedWorkout] = useState(yesterdayValue || PRESET_WORKOUTS[0]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('30');
  const [customIntensity, setCustomIntensity] = useState('moderate');
  const [saving, setSaving] = useState(false);

  const handlePresetSelect = (workout) => {
    setSelectedWorkout(workout);
  };

  const handleCustomSave = () => {
    setSelectedWorkout({
      minutes: parseInt(customMinutes),
      label: `Custom ${customMinutes} min`,
      emoji: '💪',
      intensity: customIntensity,
      color: '#D4AF37'
    });
    setShowCustomModal(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Calculate score
      const minutesScore = selectedWorkout.minutes >= 30 ? 100 :
                          selectedWorkout.minutes >= 20 ? 70 :
                          Math.round((selectedWorkout.minutes / 30) * 100);
      
      const intensityMultiplier = selectedWorkout.intensity === 'intense' ? 1.1 :
                                  selectedWorkout.intensity === 'light' ? 0.9 : 1.0;
      
      const score = Math.min(Math.round(minutesScore * intensityMultiplier), 100);
      
      // Create entry
      const today = new Date().toISOString().split('T')[0];
      await api.createEntry({
        pillar: 'exercise',
        date: today,
        score: score,
        exercise_minutes: selectedWorkout.minutes,
        exercise_intensity: selectedWorkout.intensity,
        notes: `Quick log: ${selectedWorkout.label}`,
        created_by: user.email
      });
      
      setSaving(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving exercise entry:', error);
      setSaving(false);
      alert('Failed to save entry. Please try again.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Preset Workout Buttons */}
        <div>
          <h3 className="text-white font-bold mb-3">Quick log your workout</h3>
          <div className="grid grid-cols-3 gap-3">
            {PRESET_WORKOUTS.map((workout) => {
              const Icon = workout.icon;
              return (
                <motion.button
                  key={workout.label}
                  onClick={() => handlePresetSelect(workout)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedWorkout?.label === workout.label
                      ? 'border-white/60 bg-white/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                  style={selectedWorkout?.label === workout.label ? {
                    borderColor: workout.color,
                    backgroundColor: `${workout.color}20`,
                    boxShadow: `0 0 20px ${workout.color}40`
                  } : {}}
                >
                  {selectedWorkout?.label === workout.label && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#0A1628]" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl mb-2">{workout.emoji}</div>
                    <div className="text-white font-bold text-xs mb-1">{workout.label}</div>
                    <div className="text-white/60 text-xs capitalize">{workout.intensity}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {yesterdayValue && (
            <p className="text-white/40 text-xs mt-2 text-center">
              Yesterday: {yesterdayValue.label || `${yesterdayValue.minutes} min`}
            </p>
          )}
        </div>

        {/* Custom Workout Button */}
        <button
          onClick={() => setShowCustomModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold">Custom Workout</span>
        </button>

        {/* Selected Workout Summary */}
        {selectedWorkout && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-bold">Selected Workout</div>
                <div className="text-white/70 text-sm mt-1">
                  {selectedWorkout.emoji} {selectedWorkout.label} • {selectedWorkout.intensity}
                </div>
              </div>
              <div className="text-3xl">{selectedWorkout.emoji}</div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || !selectedWorkout}
          className="w-full bg-gradient-to-r from-[#FF5733] to-[#FF7F50] text-white font-bold hover:shadow-lg py-6 text-lg"
          style={{ boxShadow: '0 0 20px rgba(255, 87, 51, 0.4)' }}
        >
          {saving ? 'Saving...' : 'Log Workout'}
        </Button>
      </div>

      {/* Custom Workout Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1628]/95 backdrop-blur-sm p-6"
            onClick={() => setShowCustomModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full"
              style={{ boxShadow: '0 0 60px rgba(212, 175, 55, 0.4)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Custom Workout</h3>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block font-bold">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="30"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block font-bold">Intensity</Label>
                  <Select value={customIntensity} onValueChange={setCustomIntensity}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="intense">Intense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCustomSave}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
                >
                  Set Custom Workout
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}