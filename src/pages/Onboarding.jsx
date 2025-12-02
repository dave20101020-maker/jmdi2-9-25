import { api } from "@/utils/apiClient";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, PILLARS } from '@/utils';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Star, Zap, Target, TrendingUp, Clock, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { format, addDays } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "sonner";

const PILLARS_ARRAY = Object.entries(PILLARS).map(([id, data]) => ({ id, ...data }));

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPillars, setSelectedPillars] = useState([]);
  const [goalText, setGoalText] = useState("");
  const [goalDate, setGoalDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [reminderTime, setReminderTime] = useState("20:00");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [firstLogValue, setFirstLogValue] = useState(7);
  const [firstLogNotes, setFirstLogNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePillar = (pillarId) => {
    if (selectedPillars.includes(pillarId)) {
      setSelectedPillars(selectedPillars.filter(id => id !== pillarId));
    } else {
      setSelectedPillars([...selectedPillars, pillarId]);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Save onboarding profile via the onboarding API
      const profilePayload = {
        selectedPillars: selectedPillars.length >= 3 ? selectedPillars : selectedPillars.slice(0, 3),
        reminderEnabled,
        reminderTime,
        initialEntry: firstLogValue ? { value: firstLogValue, notes: firstLogNotes } : null,
        goal: goalText.trim() ? { text: goalText, targetDate: goalDate } : null,
      };

      await api.saveOnboardingProfile(profilePayload);

      // Additionally create entry/goal via existing endpoints for compatibility
      if (firstLogValue && selectedPillars.length > 0) {
        const firstPillar = selectedPillars[0];
        const score = firstLogValue * 10; // Convert 1-10 to 0-100

        await api.createEntry({
          pillar: firstPillar,
          date: format(new Date(), 'yyyy-MM-dd'),
          score: score,
          notes: firstLogNotes || "My first entry! 🌟",
        });
      }

      if (goalText.trim()) {
        await api.createGoal({
          pillar: selectedPillars[0] || 'sleep',
          goalStatement: goalText,
          specific: goalText,
          measurable: 'Track daily score',
          timeBound: goalDate,
          status: 'active',
        });
      }

      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F4D03F', '#FFD700']
      });

      toast.success("Welcome to NorthStar! 🌟");
      
      // Navigate to dashboard
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center relative z-10"
          >
            <div className="mb-8">
              <div className="text-6xl mb-4">⭐</div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                You're about to transform your life
              </h1>
              <p className="text-xl text-white/70 mb-6">
                Join thousands optimizing their wellbeing with AI guidance
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-8 text-[#F4D03F]">
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <span className="text-white/80 ml-2">4.8/5 rating from 1,247 users</span>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="btn-primary text-lg px-8 py-6 text-[#0A1628] font-bold"
            >
              Begin Your Journey
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🤯</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Tired of juggling 10 different wellness apps?
              </h1>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-start gap-4">
                <div className="text-4xl">📱</div>
                <div>
                  <h3 className="text-white font-bold mb-1">Too many apps to maintain</h3>
                  <p className="text-white/60 text-sm">Sleep tracker, fitness app, mood journal... it's overwhelming</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-start gap-4">
                <div className="text-4xl">📊</div>
                <div>
                  <h3 className="text-white font-bold mb-1">Progress scattered everywhere</h3>
                  <p className="text-white/60 text-sm">Your data is siloed across different platforms</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-start gap-4">
                <div className="text-4xl">🤯</div>
                <div>
                  <h3 className="text-white font-bold mb-1">No holistic view of your life</h3>
                  <p className="text-white/60 text-sm">Can't see how sleep affects mood, or exercise impacts energy</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(3)}
              className="btn-primary w-full text-lg py-6"
            >
              I want a better way
            </Button>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="mb-8">
              <div className="text-6xl mb-4">🌟</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                One app. Eight life pillars. Complete transformation.
              </h1>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#F4D03F]/20 border border-[#D4AF37]/40 rounded-xl p-6">
                <Target className="w-12 h-12 mx-auto mb-3 text-[#D4AF37]" />
                <h3 className="text-white font-bold mb-2">Track everything in one place</h3>
                <p className="text-white/70 text-sm">All 8 pillars of wellbeing in a single, beautiful interface</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/40 rounded-xl p-6">
                <Zap className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                <h3 className="text-white font-bold mb-2">Get AI coaching 24/7</h3>
                <p className="text-white/70 text-sm">Personal AI coaches for each pillar, always available</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl p-6">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <h3 className="text-white font-bold mb-2">See how it all connects</h3>
                <p className="text-white/70 text-sm">Discover patterns and optimize your entire life</p>
              </div>
            </div>

            <Button
              onClick={() => setStep(4)}
              className="btn-primary text-lg px-8 py-6"
            >
              Show me how it works
            </Button>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
              How NorthStar Works
            </h1>

            <div className="space-y-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 text-xl font-bold text-[#D4AF37]">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl mb-2">Log Daily</h3>
                  <p className="text-white/70 mb-3">Quick 60-second check-ins for any pillar. No overthinking required.</p>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-sm text-white/60 mb-2">How's your sleep? 😴</div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '70%' }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-xl font-bold text-blue-400">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl mb-2">Get Coached</h3>
                  <p className="text-white/70 mb-3">AI coaches analyze your data and give personalized advice.</p>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="text-2xl">🤖</div>
                      <div className="text-sm text-white/80">
                        "Your sleep has improved 15% this week! Try going to bed 30 minutes earlier tonight."
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-xl font-bold text-green-400">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl mb-2">Watch Growth</h3>
                  <p className="text-white/70 mb-3">Track your progress and discover patterns across all pillars.</p>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">72</div>
                      <div className="text-xs text-white/60">Last Week</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">85</div>
                      <div className="text-xs text-white/60">This Week</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <Button
              onClick={() => setStep(5)}
              className="btn-primary w-full text-lg py-6"
            >
              I'm ready to start
            </Button>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Which areas do you want to improve first?
              </h1>
              <p className="text-white/70 mb-2">Choose 3-5 pillars to focus on (you can change later)</p>
              <div className="text-[#D4AF37] font-bold">
                Selected: {selectedPillars.length}/8
                {selectedPillars.length >= 3 && selectedPillars.length <= 5 && " ✓"}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {PILLARS_ARRAY.map(pillar => {
                const isSelected = selectedPillars.includes(pillar.id);
                return (
                  <motion.button
                    key={pillar.id}
                    onClick={() => togglePillar(pillar.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br border-[#D4AF37] shadow-lg'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                    style={isSelected ? {
                      boxShadow: `0 0 30px ${pillar.color}60`,
                      background: `linear-gradient(to bottom right, ${pillar.color}20, ${pillar.color}10)`
                    } : {}}
                  >
                    <div className="text-4xl mb-3">{pillar.icon}</div>
                    <div className="text-white font-bold mb-1">{pillar.name}</div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#0A1628]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <Button
              onClick={() => setStep(6)}
              disabled={selectedPillars.length < 3}
              className="btn-primary w-full text-lg py-6 disabled:opacity-50"
            >
              Continue
              {selectedPillars.length < 3 && ` (Select ${3 - selectedPillars.length} more)`}
            </Button>
          </motion.div>
        );

      case 6:
        const firstSelectedPillar = selectedPillars[0] ? PILLARS[selectedPillars[0]] : null;
        const suggestedGoal = firstSelectedPillar ? `Improve my ${firstSelectedPillar.name.toLowerCase()} score to 80+` : "";
        
        if (!goalText && suggestedGoal) {
          setGoalText(suggestedGoal);
        }

        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Let's set your first goal
              </h1>
              <p className="text-white/70">Based on your selections, here's a suggested goal</p>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-white font-bold mb-2">Your Goal</label>
                <Input
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="bg-white/10 border-white/20 text-white text-lg py-6"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Target Date</label>
                <Input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="bg-white/10 border-white/20 text-white text-lg py-6"
                />
                <p className="text-white/60 text-sm mt-2">
                  That's {Math.ceil((new Date(goalDate) - new Date()) / (1000 * 60 * 60 * 24))} days from now
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(7)}
                variant="ghost"
                className="flex-1 border border-white/20 text-white hover:bg-white/10"
              >
                Skip for now
              </Button>
              <Button
                onClick={() => setStep(7)}
                disabled={!goalText.trim()}
                className="btn-primary flex-1 text-lg py-6"
              >
                Set my goal
              </Button>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            key="step7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔔</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Stay on track with daily reminders
              </h1>
              <p className="text-white/70">Users with reminders are 3x more likely to hit their goals</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {reminderEnabled ? (
                    <Bell className="w-8 h-8 text-[#D4AF37]" />
                  ) : (
                    <BellOff className="w-8 h-8 text-white/40" />
                  )}
                  <div>
                    <div className="text-white font-bold">Daily Check-in Reminders</div>
                    <div className="text-white/60 text-sm">Get notified to log your progress</div>
                  </div>
                </div>
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    reminderEnabled ? 'bg-[#D4AF37]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      reminderEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {reminderEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-white font-bold mb-2">Reminder Time</label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="bg-white/10 border-white/20 text-white text-lg py-6"
                  />
                </motion.div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(8)}
                variant="ghost"
                className="flex-1 border border-white/20 text-white hover:bg-white/10"
              >
                Skip for now
              </Button>
              <Button
                onClick={() => setStep(8)}
                className="btn-primary flex-1 text-lg py-6"
              >
                {reminderEnabled ? 'Enable Notifications' : 'Continue'}
              </Button>
            </div>
          </motion.div>
        );

      case 8:
        const firstPillar = selectedPillars[0] ? PILLARS[selectedPillars[0]] : null;

        return (
          <motion.div
            key="step8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Let's log your first entry!
              </h1>
              <p className="text-white/70">This will give us a baseline for {firstPillar?.name}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">{firstPillar?.icon}</div>
                <div>
                  <div className="text-white font-bold text-xl">How do you feel about {firstPillar?.name}?</div>
                  <div className="text-white/60 text-sm">Rate from 1 (poor) to 10 (excellent)</div>
                </div>
              </div>

              <div className="mb-6">
                <Slider
                  value={[firstLogValue]}
                  onValueChange={([value]) => setFirstLogValue(value)}
                  min={1}
                  max={10}
                  step={1}
                  className="mb-4"
                />
                <div className="flex items-center justify-center gap-2">
                  <div className="text-5xl font-bold text-[#D4AF37]">{firstLogValue}</div>
                  <div className="text-white/60">/10</div>
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Optional Notes</label>
                <Input
                  value={firstLogNotes}
                  onChange={(e) => setFirstLogNotes(e.target.value)}
                  placeholder="Any thoughts about your day?"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(9)}
              className="btn-primary w-full text-lg py-6"
            >
              Save My First Entry 🌟
            </Button>
          </motion.div>
        );

      case 9:
        return (
          <motion.div
            key="step9"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-8xl mb-6"
            >
              ✨
            </motion.div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Your personal NorthStar dashboard
            </h1>
            <p className="text-xl text-white/70 mb-8">
              Everything you need to transform your life, all in one place
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-[#D4AF37]/20 to-[#F4D03F]/20 border border-[#D4AF37]/40 rounded-xl p-6"
              >
                <div className="text-4xl mb-3">⭐</div>
                <div className="text-white font-bold mb-1">Your Life Score</div>
                <div className="text-white/70 text-sm">See your overall wellbeing at a glance</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/40 rounded-xl p-6"
              >
                <div className="text-4xl mb-3">🎯</div>
                <div className="text-white font-bold mb-1">Track Any Pillar</div>
                <div className="text-white/70 text-sm">Tap any pillar card to log progress</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl p-6"
              >
                <div className="text-4xl mb-3">🤖</div>
                <div className="text-white font-bold mb-1">AI Coaches</div>
                <div className="text-white/70 text-sm">Get personalized advice anytime</div>
              </motion.div>
            </div>

            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="btn-primary text-xl px-12 py-8"
            >
              {isSubmitting ? 'Setting up your dashboard...' : 'Start Exploring 🚀'}
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0A1628, #1A1838)' }} />
        
        {/* Animated stars */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="star absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Nebula effects */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          {/* Progress indicator */}
          {step > 1 && (
            <div className="mb-8">
              <div className="flex justify-center gap-2 mb-2">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i + 1 <= step
                        ? 'w-12 bg-[#D4AF37]'
                        : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center text-white/60 text-sm">
                Step {step} of 9
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}