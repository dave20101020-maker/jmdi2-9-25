import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MeditationPlayer({ session, onComplete, onClose, pillar }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState("");
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [moodAfter, setMoodAfter] = useState(5);
  const intervalRef = useRef(null);
  
  const totalSeconds = session.duration * 60;
  const progress = (currentTime / totalSeconds) * 100;
  
  useEffect(() => {
    if (isPlaying && currentTime < totalSeconds) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          
          // Check for instructions at this timestamp
          if (session.voiceInstructions) {
            const instruction = session.voiceInstructions.find(
              inst => Math.floor(inst.timestamp) === Math.floor(newTime)
            );
            if (instruction) {
              setCurrentInstruction(instruction.text);
              setTimeout(() => setCurrentInstruction(""), 5000);
            }
          }
          
          // Session completed
          if (newTime >= totalSeconds) {
            setIsPlaying(false);
            setShowMoodCheck(true);
            return totalSeconds;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentTime, totalSeconds, session.voiceInstructions]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentInstruction("");
  };
  
  const handleComplete = () => {
    onComplete({
      sessionId: session.id,
      sessionTitle: session.title,
      duration: session.duration,
      completed: currentTime >= totalSeconds * 0.8, // 80% completion counts
      pillar: pillar,
      moodAfter: moodAfter
    });
  };
  
  if (showMoodCheck) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A1628]/95 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-2xl font-bold text-white mb-4">How do you feel now?</h3>
          <p className="text-white/70 mb-4 text-sm">Rate your current mood after the session</p>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                <button
                  key={val}
                  onClick={() => setMoodAfter(val)}
                  className={`w-10 h-10 rounded-full font-bold transition-all ${
                    moodAfter === val
                      ? 'bg-[#D4AF37] text-[#0A1628] scale-110'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/60">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Skip
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
            >
              Complete Session
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-[#0A1628]/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-[#1a1f35] to-[#0A1628] border border-white/20 rounded-2xl p-8 max-w-2xl w-full relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Ambient animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(76, 201, 240, 0.4) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧘‍♀️</div>
            <h2 className="text-3xl font-bold text-white mb-2">{session.title}</h2>
            <p className="text-white/70">{session.description}</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/60">
              <span>{session.duration} minutes</span>
              <span>•</span>
              <span className="capitalize">{session.type.replace('_', ' ')}</span>
            </div>
          </div>
          
          {/* Current Instruction */}
          {currentInstruction && (
            <div className="mb-6 p-4 bg-[#4CC9F0]/20 border border-[#4CC9F0]/40 rounded-xl animate-in fade-in duration-300">
              <p className="text-white text-center text-lg">{currentInstruction}</p>
            </div>
          )}
          
          {/* Progress Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              <svg className="transform -rotate-90 w-64 h-64">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="#4CC9F0"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(76, 201, 240, 0.5))' }}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-white mb-2">
                  {formatTime(currentTime)}
                </div>
                <div className="text-white/60 text-sm">
                  of {formatTime(totalSeconds)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={handleRestart}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4CC9F0] to-[#7C3AED] hover:shadow-lg flex items-center justify-center text-white transition-all transform hover:scale-105"
              style={{ boxShadow: '0 0 20px rgba(76, 201, 240, 0.5)' }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>
            
            <button
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all opacity-50"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tips */}
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/70 text-sm text-center">
              💡 Find a quiet space, sit comfortably, and focus on your breath
            </p>
          </div>
        </div>
        
        <style>{`
          @keyframes pulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.2;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.3;
            }
          }
        `}</style>
      </div>
    </div>
  );
}