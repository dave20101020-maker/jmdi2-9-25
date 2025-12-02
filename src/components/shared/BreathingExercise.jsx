import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Play, Pause, RotateCcw, Wind } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EXERCISES = [
  {
    id: "box",
    name: "Box Breathing",
    description: "4-4-4-4 pattern (Inhale-Hold-Exhale-Hold)",
    phases: [
      { name: "Inhale", duration: 4, instruction: "Breathe in slowly through your nose" },
      { name: "Hold", duration: 4, instruction: "Hold your breath gently" },
      { name: "Exhale", duration: 4, instruction: "Breathe out slowly through your mouth" },
      { name: "Hold", duration: 4, instruction: "Hold your breath gently" }
    ],
    color: "#4CC9F0"
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    description: "Calming pattern for anxiety & sleep",
    phases: [
      { name: "Inhale", duration: 4, instruction: "Breathe in through your nose" },
      { name: "Hold", duration: 7, instruction: "Hold your breath" },
      { name: "Exhale", duration: 8, instruction: "Breathe out slowly through your mouth" }
    ],
    color: "#7C3AED"
  },
  {
    id: "calm",
    name: "Deep Calm",
    description: "Simple deep breathing",
    phases: [
      { name: "Inhale", duration: 5, instruction: "Breathe in deeply" },
      { name: "Exhale", duration: 6, instruction: "Let it all out" }
    ],
    color: "#52B788"
  }
];

export default function BreathingExercise({ onClose }) {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(selectedExercise.phases[0].duration);
  const [completedCycles, setCompletedCycles] = useState(0);

  useEffect(() => {
    let interval;
    
    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // Move to next phase
            const nextPhaseIndex = (currentPhaseIndex + 1) % selectedExercise.phases.length;
            setCurrentPhaseIndex(nextPhaseIndex);
            
            // Increment cycle count when we complete all phases
            if (nextPhaseIndex === 0) {
              setCompletedCycles(prev => prev + 1);
            }
            
            return selectedExercise.phases[nextPhaseIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, currentPhaseIndex, selectedExercise]);

  const handleExerciseChange = (exercise) => {
    setSelectedExercise(exercise);
    setIsActive(false);
    setCurrentPhaseIndex(0);
    setSecondsLeft(exercise.phases[0].duration);
    setCompletedCycles(0);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentPhaseIndex(0);
    setSecondsLeft(selectedExercise.phases[0].duration);
    setCompletedCycles(0);
  };

  const currentPhase = selectedExercise.phases[currentPhaseIndex];
  const progress = ((currentPhase.duration - secondsLeft) / currentPhase.duration) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full">
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wind className="w-7 h-7 text-[#4CC9F0]" />
            Breathing Exercise
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Exercise Selection */}
          <div className="grid md:grid-cols-3 gap-3">
            {EXERCISES.map(ex => (
              <button
                key={ex.id}
                onClick={() => handleExerciseChange(ex)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedExercise.id === ex.id
                    ? 'border-2 scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                style={selectedExercise.id === ex.id ? {
                  backgroundColor: `${ex.color}20`,
                  borderColor: ex.color
                } : {}}
              >
                <div className="text-white font-bold mb-1">{ex.name}</div>
                <div className="text-white/60 text-xs">{ex.description}</div>
              </button>
            ))}
          </div>

          {/* Breathing Animation */}
          <div className="relative aspect-square max-w-md mx-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhaseIndex}
                  className="relative w-64 h-64 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle, ${selectedExercise.color}40, ${selectedExercise.color}10)`
                  }}
                  animate={{
                    scale: currentPhase.name === "Inhale" ? [1, 1.3] :
                           currentPhase.name === "Exhale" ? [1.3, 1] : 1,
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: currentPhase.duration,
                    repeat: 0,
                    ease: "easeInOut"
                  }}
                >
                  <div className="text-center">
                    <div className="text-white text-6xl font-bold mb-2">{secondsLeft}</div>
                    <div className="text-white/80 text-xl font-medium mb-1">
                      {currentPhase.name}
                    </div>
                    <div className="text-white/60 text-sm max-w-[200px]">
                      {currentPhase.instruction}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke={selectedExercise.color}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 0.5 }}
                style={{
                  strokeDasharray: "283",
                  strokeDashoffset: 283 * (1 - progress / 100)
                }}
              />
            </svg>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{completedCycles}</div>
              <div className="text-white/60 text-sm">Cycles</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <div className="text-2xl font-bold text-white">{completedCycles * selectedExercise.phases.length}</div>
              <div className="text-white/60 text-sm">Breaths</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              onClick={() => setIsActive(!isActive)}
              className="flex-1 bg-gradient-to-r from-[#4CC9F0] to-[#5EE0FF] text-white font-bold"
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  {completedCycles > 0 ? 'Resume' : 'Start'}
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Guidance */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white/70 text-sm">
              💡 <strong>Tip:</strong> Find a quiet space, sit comfortably, and focus solely on your breath. If your mind wanders, gently bring your attention back to the rhythm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}