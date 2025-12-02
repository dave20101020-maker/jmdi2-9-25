import React from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function AchievementCard({ badge, isUnlocked, progress = null, onClick }) {
  return (
    <motion.button
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all text-center ${
        isUnlocked
          ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#F4D03F]/20 border-[#D4AF37]/40 shadow-lg'
          : 'bg-white/5 border-white/10 opacity-60'
      }`}
      style={isUnlocked ? { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' } : {}}
    >
      <div className="text-4xl mb-2 relative">
        {isUnlocked ? (
          badge.icon
        ) : (
          <div className="relative">
            <div className="opacity-30">{badge.icon}</div>
            <Lock className="w-4 h-4 text-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>
      
      <div className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-white' : 'text-white/60'}`}>
        {badge.name}
      </div>
      
      <div className="text-xs text-white/60 mb-2">{badge.requirement}</div>
      
      {isUnlocked ? (
        <div className="text-[#D4AF37] text-xs font-bold">+{badge.points} pts</div>
      ) : progress ? (
        <div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] rounded-full transition-all"
              style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-white/50">
            {progress.current}/{progress.target}
          </div>
        </div>
      ) : (
        <div className="text-xs text-white/40">🔒 Locked</div>
      )}
    </motion.button>
  );
}