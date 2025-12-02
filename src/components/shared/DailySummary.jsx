import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function DailySummary({ entries, lifeScore, pillarScores, accessiblePillars, user }) {
  const [greeting, setGreeting] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    generateGreeting();
  }, [lifeScore, entries.length]);
  
  const generateGreeting = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayEntries = entries.filter(e => e.date === today);
    
    if (todayEntries.length === 0) {
      setGreeting("Let's make today count! Track your first pillar to get started.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      const loggedPillars = todayEntries.map(e => {
        const pillar = accessiblePillars.find(p => p.id === e.pillar);
        return pillar ? pillar.name : e.pillar;
      }).join(', ');
      
      const prompt = `Generate a brief, encouraging daily greeting for a personal growth app user.

Today's Progress:
- Life Score: ${lifeScore}/100
- Pillars Tracked: ${loggedPillars}
- Total Logs Today: ${todayEntries.length}

Create ONE SHORT sentence (max 15 words) that:
- Acknowledges their progress
- Is encouraging and personal
- Mentions their life score OR tracked pillars
- Feels conversational and warm

Examples:
"Great start! You've tracked 3 pillars and your score is 75 today."
"Nice work! Exercise and Diet are logged – keep the momentum going!"

Return ONLY the greeting text, no JSON, no quotes, just the sentence.`;

      const result = await api.aiCoach({
        prompt: prompt
      });
      
      if (result && typeof result === 'string' && result.trim()) {
        setGreeting(result.trim());
        setHasError(false);
      } else {
        throw new Error('Invalid greeting response');
      }
      
    } catch (error) {
      console.error('Error generating greeting:', error);
      setHasError(true);
      setGreeting(getFallbackGreeting(todayEntries, lifeScore));
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFallbackGreeting = (todayEntries, score) => {
    if (todayEntries.length === 0) {
      return "Ready to shine today? Track your first pillar!";
    }
    
    if (score >= 80) {
      return `Outstanding! ${todayEntries.length} pillar${todayEntries.length !== 1 ? 's' : ''} tracked with a ${score} score!`;
    } else if (score >= 60) {
      return `Good progress! ${todayEntries.length} pillar${todayEntries.length !== 1 ? 's' : ''} logged today. Keep going!`;
    } else {
      return `You're showing up! ${todayEntries.length} pillar${todayEntries.length !== 1 ? 's' : ''} tracked. Every step counts!`;
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div 
          key="loading"
          className="flex items-center justify-center gap-2 text-white/60 text-sm py-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating daily summary...</span>
        </motion.div>
      ) : (
        <motion.div 
          key="greeting"
          className={`text-white/80 text-sm flex items-center justify-center gap-2 ${hasError ? 'italic' : ''}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {!hasError && <Sparkles className="w-4 h-4 text-[#FFD700] animate-pulse" />}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {greeting}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}