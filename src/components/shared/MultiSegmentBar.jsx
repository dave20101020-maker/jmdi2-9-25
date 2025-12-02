import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function MultiSegmentBar({ 
  segments = [],
  total = 7,
  label = "Progress",
  color = "#D4AF37",
  emptyColor = "rgba(255, 255, 255, 0.1)"
}) {
  const completedCount = segments.filter(s => s.completed).length;
  const percentage = (completedCount / total) * 100;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">{label}</span>
        <motion.span 
          className="font-bold text-sm"
          style={{ color }}
          key={completedCount}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {completedCount}/{total}
        </motion.span>
      </div>

      {/* Multi-segment bar */}
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, idx) => {
          const segment = segments[idx];
          const isCompleted = segment?.completed || false;
          const segmentColor = segment?.color || color;
          
          return (
            <motion.div
              key={idx}
              className="flex-1 h-3 rounded-full relative overflow-hidden"
              style={{ 
                backgroundColor: isCompleted ? segmentColor : emptyColor,
                boxShadow: isCompleted ? `0 0 10px ${segmentColor}60` : 'none'
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ 
                delay: idx * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              whileHover={{ 
                scaleY: 1.5,
                transition: { duration: 0.2 }
              }}
            >
              {/* Shimmer effect for completed segments */}
              {isCompleted && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                />
              )}

              {/* Checkmark for completed */}
              {isCompleted && segment?.value !== undefined && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: idx * 0.05 + 0.2,
                      type: "spring",
                      stiffness: 400
                    }}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-white/80" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Details row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">{Math.round(percentage)}% complete</span>
        {segments.some(s => s.label) && (
          <div className="flex gap-2">
            {segments.filter(s => s.completed && s.label).slice(0, 2).map((seg, i) => (
              <motion.span 
                key={i}
                className="px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${seg.color || color}20`,
                  color: seg.color || color,
                  border: `1px solid ${seg.color || color}30`
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {seg.label}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}