import { api } from "@/utils/apiClient";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const PILLARS = [
  { id: "sleep", name: "Sleep", color: "#6B46C1", icon: "🌙", description: "Optimize your rest" },
  { id: "diet", name: "Diet", color: "#52B788", icon: "🥗", description: "Nourish your body" },
  { id: "exercise", name: "Exercise", color: "#FF5733", icon: "💪", description: "Build strength" },
  { id: "physical_health", name: "Physical Health", color: "#FF7F50", icon: "❤️", description: "Stay healthy" },
  { id: "mental_health", name: "Mental Health", color: "#4CC9F0", icon: "🧠", description: "Find peace" },
  { id: "finances", name: "Finances", color: "#2E8B57", icon: "💰", description: "Build wealth" },
  { id: "social", name: "Social", color: "#FFD700", icon: "👥", description: "Connect deeply" },
  { id: "spirituality", name: "Spirituality", color: "#7C3AED", icon: "✨", description: "Discover purpose" }
];

export default function Onboardingv2() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [priorities, setPriorities] = useState([]);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [firstLogData, setFirstLogData] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(0, s - 1));
  
  const togglePriority = (pillarId) => {
    setPriorities(prev => 
      prev.includes(pillarId)
        ? prev.filter(id => id !== pillarId)
        : [...prev, pillarId]
    );
  };
  
  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      // Update user profile
      await api.authUpdateMe({
        priorities,
        onboarding_completed: true,
        daily_reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        total_check_ins: 1
      });
      
      // Create first entry if data was logged
      if (priorities[0] && firstLogData.rating) {
        const pillarId = priorities[0];
        const score = firstLogData.rating * 10;
        
        await api.createEntry({
          pillar: pillarId,
          date: new Date().toISOString().split('T')[0],
          score,
          notes: "First entry from onboarding"
        });
      }
      
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Onboarding error:", error);
    }
    setIsCompleting(false);
  };
  
  const screens = [
    // Screen 1: Welcome
    <div key="welcome" className="text-center animate-in fade-in duration-1000">
      <div className="mb-8 relative">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-6xl animate-pulse-slow"
          style={{ boxShadow: '0 0 60px rgba(212, 175, 55, 0.6)' }}
        >
          ⭐
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#D4AF37] rounded-full animate-ping"
              style={{
                left: `${50 + Math.cos((i * 30 * Math.PI) / 180) * 80}%`,
                top: `${50 + Math.sin((i * 30 * Math.PI) / 180) * 80}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        Welcome to NorthStar
      </h1>
      <p className="text-xl text-white/80 mb-8">
        Your personal life optimization platform
      </p>
      <p className="text-white/60 max-w-md mx-auto mb-12">
        Transform your life with science-backed, AI-powered guidance across 8 essential pillars of wellness
      </p>
      <Button
        onClick={nextStep}
        size="lg"
        className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg px-8 py-6 text-lg"
        style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}
      >
        Begin Your Journey
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>,
    
    // Screen 2: What is NorthStar
    <div key="what" className="text-center animate-in fade-in duration-500">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        8 Life Pillars, One Platform
      </h2>
      <div className="relative w-64 h-64 mx-auto mb-8">
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F]"
          style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
        />
        {PILLARS.map((pillar, i) => {
          const angle = (i * 360) / 8;
          const radius = 100;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <div
              key={pillar.id}
              className="absolute w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-500 animate-in fade-in"
              style={{
                left: `calc(50% + ${x}px - 24px)`,
                top: `calc(50% + ${y}px - 24px)`,
                backgroundColor: pillar.color,
                boxShadow: `0 0 20px ${pillar.color}80`,
                animationDelay: `${i * 0.1}s`
              }}
            >
              {pillar.icon}
            </div>
          );
        })}
      </div>
      <p className="text-white/80 max-w-lg mx-auto mb-8">
        Track and improve every aspect of your life with AI-powered guidance. No more juggling 10 different apps.
      </p>
      <Button onClick={nextStep} size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
        Next
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>,
    
    // Screen 3: How It Works
    <div key="how" className="text-center animate-in fade-in duration-500">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
        How It Works
      </h2>
      <div className="space-y-8 max-w-md mx-auto mb-12">
        {[
          { icon: "📱", title: "Track Daily", desc: "Quick 30-second check-ins for each pillar" },
          { icon: "🤖", title: "Get AI Coaching", desc: "Personalized guidance from expert coaches" },
          { icon: "📈", title: "Watch Growth", desc: "See your life score improve over time" }
        ].map((item, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 animate-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <div className="text-5xl mb-3">{item.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-white/60">{item.desc}</p>
          </div>
        ))}
      </div>
      <Button onClick={nextStep} size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
        Got It
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>,
    
    // Screen 4: Scoring System
    <div key="scoring" className="text-center animate-in fade-in duration-500">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Your Life Score
      </h2>
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md mx-auto mb-8">
        <div className="text-7xl font-bold text-[#D4AF37] mb-4 animate-count">0-100</div>
        <p className="text-white/80 mb-6">
          Every pillar gets a score based on your inputs. Your overall Life Score is the average of all 8 pillars.
        </p>
        <div className="space-y-2">
          {PILLARS.slice(0, 3).map((pillar, i) => (
            <div key={pillar.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="flex items-center gap-2 text-white">
                <span>{pillar.icon}</span>
                <span>{pillar.name}</span>
              </span>
              <span className="font-bold" style={{ color: pillar.color }}>
                {85 - i * 10}/100
              </span>
            </div>
          ))}
          <div className="text-white/40 text-sm">+ 5 more pillars...</div>
        </div>
      </div>
      <Button onClick={nextStep} size="lg" className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold">
        See It In Action
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>,
    
    // Screen 5: Pick Priorities
    <div key="priorities" className="animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          What Matters Most?
        </h2>
        <p className="text-white/60">Select 3-5 pillars to focus on first</p>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
        {PILLARS.map(pillar => {
          const isSelected = priorities.includes(pillar.id);
          return (
            <button
              key={pillar.id}
              onClick={() => togglePriority(pillar.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'bg-white/20 border-white/40 scale-105'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              style={isSelected ? { boxShadow: `0 0 20px ${pillar.color}60` } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{pillar.icon}</span>
                {isSelected && <Check className="w-6 h-6 text-[#D4AF37]" />}
              </div>
              <div className="text-white font-semibold text-left">{pillar.name}</div>
              <div className="text-white/60 text-sm text-left">{pillar.description}</div>
            </button>
          );
        })}
      </div>
      <div className="text-center">
        <div className="text-white/60 mb-4">
          {priorities.length} selected {priorities.length >= 3 && priorities.length <= 5 && '✓'}
        </div>
        <Button
          onClick={nextStep}
          disabled={priorities.length < 3}
          size="lg"
          className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold disabled:opacity-50"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>,
    
    // Screen 6: Notifications
    <div key="notifications" className="text-center animate-in fade-in duration-500">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Stay On Track
      </h2>
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-md mx-auto mb-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-left flex-1">
              <div className="text-white font-semibold mb-1">Daily Check-in Reminder</div>
              <div className="text-white/60 text-sm">Get a gentle reminder to log your day</div>
            </div>
            <button
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`w-14 h-8 rounded-full transition-colors ${
                reminderEnabled ? 'bg-[#D4AF37]' : 'bg-white/20'
              }`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transform transition-transform ${
                reminderEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {reminderEnabled && (
            <div className="animate-in slide-in-from-top duration-300">
              <label className="text-white text-sm mb-2 block text-left">Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
              />
            </div>
          )}
        </div>
      </div>
      <p className="text-white/40 text-sm mb-8">You can change these anytime in settings</p>
      <Button onClick={nextStep} size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
        Almost Done!
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>,
    
    // Screen 7: First Log
    <div key="firstlog" className="text-center animate-in fade-in duration-500">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Let's Log Your First Entry!
      </h2>
      {priorities[0] && (
        <>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md mx-auto mb-8">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-5xl mb-4"
              style={{
                backgroundColor: `${PILLARS.find(p => p.id === priorities[0])?.color}30`,
                boxShadow: `0 0 30px ${PILLARS.find(p => p.id === priorities[0])?.color}60`
              }}
            >
              {PILLARS.find(p => p.id === priorities[0])?.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {PILLARS.find(p => p.id === priorities[0])?.name}
            </h3>
            <p className="text-white/60 mb-6">How are you feeling with this today?</p>
            
            <Slider
              value={[firstLogData.rating || 5]}
              onValueChange={([value]) => setFirstLogData({ rating: value })}
              min={1}
              max={10}
              step={1}
              className="mb-4"
            />
            <div className="flex justify-between text-white/60 text-sm mb-2">
              <span>Poor</span>
              <span className="text-white font-bold text-xl">{firstLogData.rating || 5}/10</span>
              <span>Excellent</span>
            </div>
            <p className="text-white/40 text-xs mt-6">This takes just 5 seconds per pillar</p>
          </div>
          <Button onClick={nextStep} size="lg" className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold">
            Log It! 🎯
          </Button>
        </>
      )}
    </div>,
    
    // Screen 8: Complete
    <div key="complete" className="text-center animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-6xl mb-6 animate-bounce"
          style={{ boxShadow: '0 0 60px rgba(212, 175, 55, 0.6)' }}
        >
          🌟
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          You're All Set!
        </h2>
        <div className="text-6xl font-bold text-[#D4AF37] mb-2">
          {firstLogData.rating ? (firstLogData.rating * 10) : 0}/100
        </div>
        <p className="text-white/60 mb-8">Your initial Life Score</p>
      </div>
      
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-md mx-auto mb-8">
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-green-400" />
            <span>{priorities.length} pillars selected</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-green-400" />
            <span>First entry logged</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-green-400" />
            <span>AI coaches activated</span>
          </div>
        </div>
      </div>
      
      <Button
        onClick={completeOnboarding}
        disabled={isCompleting}
        size="lg"
        className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg px-12 py-6 text-lg"
        style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}
      >
        {isCompleting ? 'Loading...' : 'Enter NorthStar'}
        <ChevronRight className="w-6 h-6 ml-2" />
      </Button>
    </div>
  ];
  
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        {screens[step]}
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-12">
          {screens.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
        
        {/* Skip Option */}
        {step > 0 && step < screens.length - 1 && (
          <button
            onClick={() => setStep(screens.length - 1)}
            className="block mx-auto mt-6 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}