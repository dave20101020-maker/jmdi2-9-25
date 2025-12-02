import React from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronRight } from "lucide-react";
import MilestoneCard from "@/components/shared/MilestoneCard";

export default function MilestonesSection({ 
  milestones = [],
  color = "#D4AF37",
  title = "Recent Milestones",
  compact = false,
  maxVisible = 3
}) {
  if (milestones.length === 0) return null;

  const visibleMilestones = milestones.slice(0, maxVisible);
  const hasMore = milestones.length > maxVisible;

  return (
    <motion.div 
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6 relative overflow-hidden"
      style={{ boxShadow: `0 0 30px ${color}20` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      {/* Background celebration effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}, transparent)`,
              left: `${10 + (i % 4) * 25}%`,
              top: `${10 + Math.floor(i / 4) * 30}%`
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.6, 0],
              y: [0, -30]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              repeatDelay: 2
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Trophy className="w-5 h-5" style={{ color }} />
          </motion.div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
        </div>
        
        {hasMore && (
          <motion.button
            className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
            whileHover={{ x: 3 }}
          >
            View all ({milestones.length})
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Milestones grid */}
      <div className={`relative z-10 ${
        compact 
          ? 'space-y-3' 
          : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      }`}>
        {visibleMilestones.map((milestone, idx) => (
          <MilestoneCard
            key={milestone.id || idx}
            milestone={milestone}
            index={idx}
            compact={compact}
          />
        ))}
      </div>

      {/* Celebration message */}
      {visibleMilestones.some(m => m.isNew) && (
        <motion.div
          className="mt-4 text-center text-sm font-medium relative z-10"
          style={{ color }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          🎉 Congratulations on your achievements!
        </motion.div>
      )}
    </motion.div>
  );
}