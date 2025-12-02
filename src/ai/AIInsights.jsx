import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Target, Lightbulb, Zap, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

// Animation variants optimized for performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

export default function AIInsights({ entries, lifeScore, pillarScores, accessiblePillars, plans, user }) {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  
  const MAX_RETRIES = 2;
  
  useEffect(() => {
    generateInsights();
  }, [entries.length, lifeScore, user?.email]);
  
  const generateInsights = async () => {
    if (!user?.email || entries.length < 3) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => 
        format(subDays(new Date(), i), 'yyyy-MM-dd')
      );
      
      const recentEntries = entries.filter(e => last7Days.includes(e.date));
      
      const pillarPerformance = accessiblePillars.map(p => {
        const pillarEntries = recentEntries.filter(e => e.pillar === p.id);
        const avgScore = pillarEntries.length > 0
          ? Math.round(pillarEntries.reduce((sum, e) => sum + e.score, 0) / pillarEntries.length)
          : 0;
        return {
          name: p.name,
          avgScore,
          logCount: pillarEntries.length
        };
      }).filter(p => p.logCount > 0);
      
      const strongest = pillarPerformance.length > 0
        ? pillarPerformance.reduce((max, p) => p.avgScore > max.avgScore ? p : max)
        : null;
      
      const needsAttention = pillarPerformance.filter(p => p.avgScore < 60);
      
      const prompt = `You are a personal growth coach analyzing user progress. Generate personalized insights.

Current Life Score: ${lifeScore}/100
Active Pillars: ${accessiblePillars.map(p => p.name).join(', ')}
Total Logs (7 days): ${recentEntries.length}
Active Plans: ${plans.length}

Performance:
${pillarPerformance.map(p => `- ${p.name}: ${p.avgScore}/100 (${p.logCount} logs)`).join('\n')}

Strongest: ${strongest?.name || 'N/A'} (${strongest?.avgScore || 0})
Needs Attention: ${needsAttention.map(p => p.name).join(', ') || 'All areas doing well'}

Generate concise, actionable insights:
1. greeting: Warm, personalized greeting (1 sentence)
2. celebration: Celebrate their strongest area (1 sentence, if applicable)
3. focus_area: What needs attention (1 pillar name only)
4. top_insights: Array of 3 specific observations (each 1 sentence, actionable)
5. recommendations: Array of 3 concrete actions (each 1 sentence, specific)
6. suggested_plan: If needed, suggest a simple plan (title: max 50 chars, description: max 100 chars)
7. encouragement: Brief motivational message (1 sentence)

Be positive, specific, and actionable. Return valid JSON only.`;

      const result = await api.aiCoach({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            greeting: { type: "string" },
            celebration: { type: "string" },
            focus_area: { type: "string" },
            top_insights: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            suggested_plan: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" }
              }
            },
            encouragement: { type: "string" }
          },
          required: ["greeting", "top_insights", "recommendations", "encouragement"]
        }
      });
      
      if (result && typeof result === 'object' && result.greeting) {
        setInsights(result);
        setHasError(false);
        setRetryCount(0);
      } else {
        throw new Error('Invalid AI response format');
      }
      
    } catch (error) {
      console.error('Error generating insights:', error);
      setHasError(true);
      
      if (retryCount < MAX_RETRIES) {
        toast.error(`AI insights failed. Retrying... (${retryCount + 1}/${MAX_RETRIES})`, {
          duration: 2000
        });
        setRetryCount(retryCount + 1);
        setTimeout(() => generateInsights(), 2000);
      } else {
        toast.error('Unable to generate AI insights', {
          description: 'Don\'t worry, your data is safe. Try refreshing later.',
          duration: 5000
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreatePlan = () => {
    if (insights?.suggested_plan) {
      navigate(createPageUrl("MyPlans"), {
        state: { suggestedPlan: insights.suggested_plan }
      });
    }
  };
  
  if (entries.length < 3) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-2xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-white mb-2">AI Insights Coming Soon!</h3>
            <p className="text-white/70 text-sm">
              Log at least 3 entries across your pillars to unlock personalized AI-powered insights and recommendations.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (isLoading) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-2xl p-6 mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin flex-shrink-0" />
          <div>
            <motion.h3 
              className="text-lg font-bold text-white mb-1"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Analyzing Your Progress...
            </motion.h3>
            <motion.p 
              className="text-white/70 text-sm"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AI is generating personalized insights
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (hasError && retryCount >= MAX_RETRIES) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-red-500/10 to-orange-600/10 border border-red-500/30 rounded-2xl p-6 mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Insights Temporarily Unavailable</h3>
            <p className="text-white/70 text-sm mb-4">
              We couldn't generate insights right now. Your data is safe, and you can try again in a moment.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  setRetryCount(0);
                  generateInsights();
                }}
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (!insights) {
    return null;
  }
  
  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-2xl p-6 mb-8"
      style={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center gap-2 mb-4"
        variants={itemVariants}
      >
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white">AI Insights & Recommendations</h3>
      </motion.div>
      
      <motion.p 
        className="text-white/90 mb-4"
        variants={itemVariants}
      >
        {insights.greeting}
      </motion.p>
      
      <AnimatePresence>
        {insights.celebration && (
          <motion.div 
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4"
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{insights.celebration}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {insights.focus_area && (
          <motion.div 
            className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4"
            variants={itemVariants}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex items-start gap-2">
              <Target className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-orange-300 font-bold text-sm mb-1">Focus Area</div>
                <p className="text-white/80 text-sm">{insights.focus_area}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {insights.top_insights && insights.top_insights.length > 0 && (
        <motion.div 
          className="mb-4"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h4 className="text-white font-bold">Key Insights</h4>
          </div>
          <motion.ul 
            className="space-y-2"
            variants={containerVariants}
          >
            {insights.top_insights.map((insight, idx) => (
              <motion.li 
                key={idx}
                className="flex items-start gap-2 text-white/80 text-sm"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-yellow-400 flex-shrink-0 mt-1">•</span>
                <span>{insight}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}
      
      {insights.recommendations && insights.recommendations.length > 0 && (
        <motion.div 
          className="mb-4"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <h4 className="text-white font-bold">Action Steps</h4>
          </div>
          <motion.ul 
            className="space-y-2"
            variants={containerVariants}
          >
            {insights.recommendations.map((rec, idx) => (
              <motion.li 
                key={idx}
                className="flex items-start gap-2 text-white/80 text-sm"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-blue-400 flex-shrink-0 mt-1">→</span>
                <span>{rec}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}
      
      <AnimatePresence>
        {insights.suggested_plan && (
          <motion.div 
            className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D4AF37]" />
              Suggested Plan
            </h4>
            <p className="text-white/90 text-sm mb-1 font-medium">{insights.suggested_plan.title}</p>
            <p className="text-white/70 text-sm mb-3">{insights.suggested_plan.description}</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleCreatePlan}
                size="sm"
                className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40"
              >
                Create This Plan
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.p 
        className="text-white/70 text-sm italic"
        variants={itemVariants}
      >
        {insights.encouragement}
      </motion.p>
      
      <motion.div 
        className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between"
        variants={itemVariants}
      >
        <span className="text-white/40 text-xs">Insights refreshed automatically</span>
        <motion.button
          onClick={() => {
            setRetryCount(0);
            generateInsights();
            toast.info('Refreshing insights...');
          }}
          className="text-purple-400 hover:text-purple-300 text-xs font-medium flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <RefreshCw className="w-3 h-3" />
          </motion.div>
          Refresh Now
        </motion.button>
      </motion.div>
    </motion.div>
  );
}