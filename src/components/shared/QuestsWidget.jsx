import React from "react";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function QuestsWidget({ quests, onQuestClick }) {
  const completedCount = quests.filter(q => q.completed).length;
  const allCompleted = completedCount === quests.length;
  
  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40 rounded-2xl p-6"
      style={{ boxShadow: '0 0 25px rgba(147, 51, 234, 0.3)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h3 className="text-white font-bold text-lg">Daily Quests</h3>
        </div>
        <div className="text-sm font-bold text-purple-400">
          {completedCount}/{quests.length}
        </div>
      </div>
      
      <div className="space-y-3">
        {quests.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-4 rounded-xl border transition-all ${
              quest.completed
                ? 'bg-green-500/10 border-green-500/40'
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
          >
            <div className="flex items-start gap-3">
              {quest.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-white font-medium text-sm mb-1">{quest.title}</div>
                <div className="text-white/60 text-xs mb-2">{quest.description}</div>
                {!quest.completed && (
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full transition-all"
                      style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[#D4AF37] font-bold text-sm">+{quest.points}</div>
                {quest.completed && (
                  <div className="text-green-400 text-xs">✓ Done</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {allCompleted && (
        <div className="mt-4 p-3 bg-gradient-to-r from-[#D4AF37]/20 to-[#F4D03F]/20 border border-[#D4AF37]/40 rounded-lg text-center">
          <div className="text-white font-bold text-sm mb-1">🎉 All Quests Complete!</div>
          <div className="text-[#D4AF37] text-xs">+100 bonus points awarded</div>
        </div>
      )}
    </div>
  );
}