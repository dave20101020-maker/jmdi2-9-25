import React from "react";
import { motion } from "framer-motion";

export default function LinearProgress({ 
  value = 0, 
  max = 100, 
  height = 12,
  color = "#D4AF37",
  label,
  showValue = true,
  showPercentage = true,
  icon: Icon,
  glowEffect = true,
  milestones = [] // Array of { value: number, label: string, color?: string }
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="space-y-2">
      {/* Header */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4" style={{ color }} />}
              <span className="text-white/70 text-sm">{label}</span>
            </div>
          )}
          {showValue && (
            <motion.div 
              className="flex items-center gap-2 font-bold text-sm"
              style={{ color }}
              key={value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span>{value}</span>
              {max && <span className="text-white/40">/ {max}</span>}
              {showPercentage && <span className="text-white/60">({Math.round(percentage)}%)</span>}
            </motion.div>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative">
        <div 
          className="w-full rounded-full overflow-hidden relative"
          style={{ 
            height: `${height}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px)'
            }}
          />

          {/* Progress fill */}
          <motion.div 
            className="h-full rounded-full relative overflow-hidden"
            style={{ 
              background: `linear-gradient(to right, ${color}, ${color}CC)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{
              type: "spring",
              stiffness: 80,
              damping: 20,
              mass: 1
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut"
              }}
            />

            {/* Glow effect */}
            {glowEffect && (
              <motion.div 
                className="absolute inset-0"
                style={{ 
                  boxShadow: `inset 0 0 ${height}px ${color}80, 0 0 ${height * 2}px ${color}40`
                }}
                animate={{ 
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>

          {/* Milestones */}
          {milestones.map((milestone, idx) => {
            const milestonePos = (milestone.value / max) * 100;
            const isPassed = percentage >= milestonePos;
            
            return (
              <motion.div
                key={idx}
                className="absolute top-0 bottom-0 w-0.5"
                style={{ 
                  left: `${milestonePos}%`,
                  backgroundColor: isPassed ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                {milestone.label && (
                  <div 
                    className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap px-1.5 py-0.5 rounded"
                    style={{ 
                      backgroundColor: isPassed ? `${milestone.color || color}30` : 'rgba(255,255,255,0.1)',
                      color: isPassed ? (milestone.color || color) : 'rgba(255,255,255,0.4)'
                    }}
                  >
                    {milestone.label}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pulse dot at the end of progress */}
        {percentage > 0 && percentage < 100 && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{ 
              left: `${percentage}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`
            }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </div>
  );
}