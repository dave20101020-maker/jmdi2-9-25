import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, Sparkles, TrendingUp, Trophy, Target, Zap, Users, Calendar, MessageSquare, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_STEPS = [
  {
    title: "Welcome to NorthStar! 🌟",
    content: "Your complete personal growth platform. Track 8 life pillars, build sustainable habits, set SMART goals, and get AI-powered coaching tailored to your journey.",
    icon: Sparkles,
    color: "#D4AF37"
  },
  {
    title: "Your Life Score ⭐",
    content: "This central orb shows your overall wellbeing score (0-100), calculated from all your active pillars. Each pillar contributes to your total score - the higher it is, the brighter you shine!",
    icon: Trophy,
    color: "#F4D03F"
  },
  {
    title: "Track Your Pillars 📊",
    content: "Tap any pillar card to quickly log your progress. Each pillar has its own AI coach ready to provide personalized guidance based on your specific situation and goals.",
    icon: BarChart,
    color: "#4CC9F0"
  },
  {
    title: "Quick Track Button ➕",
    content: "Use the central + button in the bottom navigation to quickly log any pillar without navigating away from your current page. Perfect for on-the-go tracking!",
    icon: Zap,
    color: "#52B788"
  },
  {
    title: "AI Insights & Recommendations 🧠",
    content: "Get personalized recommendations and insights based on your tracking patterns. Your AI analyzes your data daily to help you identify what's working and suggest improvements.",
    icon: Sparkles,
    color: "#7C3AED"
  },
  {
    title: "Goals & Plans 🎯",
    content: "Set SMART goals with AI assistance, create comprehensive life plans with actionable steps, and build daily habits. Link them together to create a powerful growth framework!",
    icon: Target,
    color: "#FF5733"
  },
  {
    title: "Advanced Analytics 📈",
    content: "Visit the Insights page to view trends over time, discover correlations between pillars, and use custom date ranges to analyze specific periods. Customize your dashboard with widgets!",
    icon: TrendingUp,
    color: "#2E8B57"
  },
  {
    title: "Community & Milestones 👥",
    content: "Connect with friends, share milestones, compete on leaderboards, and celebrate achievements together. Your growth journey is better with others!",
    icon: Users,
    color: "#FFD700"
  },
  {
    title: "Weekly Reflections 📝",
    content: "Every Sunday, reflect on your plans with guided weekly reviews. Document what worked, what didn't, and set your focus for the coming week.",
    icon: Calendar,
    color: "#6B46C1"
  },
  {
    title: "AI Coaching 💬",
    content: "Chat with specialized AI coaches for each pillar. They'll help you create plans, solve problems, and stay motivated based on the COM-B behavior change model.",
    icon: MessageSquare,
    color: "#4CC9F0"
  }
];

export default function GuidedTour({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };
  
  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };
  
  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-[#1a1f35] border-2 border-[#D4AF37]/40 rounded-2xl p-6 md:p-8 max-w-xl w-full"
          style={{ boxShadow: '0 0 50px rgba(212, 175, 55, 0.4)' }}
        >
          {/* Close Button */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1" />
            <button
              onClick={handleSkip}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Icon & Content */}
          <div className="text-center mb-6">
            <div 
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: `${step.color}20`,
                boxShadow: `0 0 30px ${step.color}40` 
              }}
            >
              <Icon className="w-10 h-10" style={{ color: step.color }} />
            </div>
            
            <div className="text-xs text-[#D4AF37] font-bold mb-3">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{step.title}</h2>
            <p className="text-white/80 leading-relaxed text-base md:text-lg">{step.content}</p>
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 my-6">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="ghost"
              className="border border-white/20 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg transition-all"
              style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-white/60 hover:text-white text-sm transition-colors font-medium"
          >
            Skip tour
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}