import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Star, Zap, Award, TrendingUp } from "lucide-react";

const MILESTONE_TYPES = {
  achievement: { icon: Trophy, gradient: "from-yellow-500 to-orange-500" },
  streak: { icon: Zap, gradient: "from-orange-500 to-red-500" },
  goal: { icon: Star, gradient: "from-purple-500 to-pink-500" },
  improvement: { icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
  award: { icon: Award, gradient: "from-green-500 to-emerald-500" },
  sparkle: { icon: Sparkles, gradient: "from-yellow-400 to-amber-500" }
};

export default function MilestoneCard({ 
  milestone,
  index = 0,
  compact = false
}) {
  const { title, description, value, icon: CustomIcon, type = "achievement", color, date, isNew = false } = milestone;
  const IconComponent = CustomIcon || MILESTONE_TYPES[type]?.icon || Trophy;
  const gradient = MILESTONE_TYPES[type]?.gradient || "from-yellow-500 to-orange-500";

  if (compact) {
    return (
      <motion.div
        className="relative bg-white/5 border border-white/20 rounded-xl p-3 overflow-hidden group cursor-default"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          delay: index * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
        whileHover={{ scale: 1.03, y: -2 }}
      >
        {/* Animated gradient background */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
          animate={{
            background: [
              `linear-gradient(135deg, ${color || '#FFD700'}20 0%, transparent 100%)`,
              `linear-gradient(225deg, ${color || '#FFD700'}20 0%, transparent 100%)`,
              `linear-gradient(135deg, ${color || '#FFD700'}20 0%, transparent 100%)`
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* "New" badge */}
        {isNew && (
          <motion.div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ 
              backgroundColor: `${color || '#FFD700'}30`,
              color: color || '#FFD700',
              border: `1px solid ${color || '#FFD700'}50`
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            NEW
          </motion.div>
        )}

        <div className="relative flex items-center gap-3">
          {/* Icon with glow */}
          <motion.div 
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center relative"
            style={{ 
              backgroundColor: `${color || '#FFD700'}20`,
              boxShadow: `0 0 20px ${color || '#FFD700'}40`
            }}
            animate={{ 
              boxShadow: [
                `0 0 20px ${color || '#FFD700'}40`,
                `0 0 30px ${color || '#FFD700'}60`,
                `0 0 20px ${color || '#FFD700'}40`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <IconComponent 
              className="w-5 h-5" 
              style={{ color: color || '#FFD700' }}
            />
            
            {/* Sparkle particles */}
            {isNew && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{ backgroundColor: color || '#FFD700' }}
                    animate={{
                      x: [0, (i - 1) * 15],
                      y: [0, -10 - i * 5],
                      opacity: [1, 0],
                      scale: [1, 0]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      repeatDelay: 1
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm truncate">{title}</h4>
            <p className="text-white/60 text-xs truncate">{description}</p>
          </div>

          {/* Value badge */}
          {value && (
            <motion.div 
              className="flex-shrink-0 text-2xl font-bold"
              style={{ color: color || '#FFD700' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: index * 0.1 + 0.3,
                type: "spring",
                stiffness: 500
              }}
            >
              {value}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-5 overflow-hidden group cursor-default"
      initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ 
        delay: index * 0.15,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      style={{
        boxShadow: `0 0 30px ${color || '#FFD700'}30`
      }}
    >
      {/* Animated starburst background */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-full h-0.5"
            style={{ 
              background: `linear-gradient(to right, transparent, ${color || '#FFD700'}, transparent)`,
              transformOrigin: 'left center',
              rotate: i * 45
            }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              repeatDelay: 2
            }}
          />
        ))}
      </div>

      {/* Floating sparkles */}
      {isNew && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 2) * 40}%`
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
            >
              <Sparkles className="w-3 h-3" style={{ color: color || '#FFD700' }} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {/* Icon */}
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center relative"
          style={{ 
            backgroundColor: `${color || '#FFD700'}20`,
            border: `2px solid ${color || '#FFD700'}40`
          }}
          animate={{ 
            boxShadow: [
              `0 0 20px ${color || '#FFD700'}40`,
              `0 0 40px ${color || '#FFD700'}60`,
              `0 0 20px ${color || '#FFD700'}40`
            ],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <IconComponent 
            className="w-8 h-8" 
            style={{ color: color || '#FFD700' }}
          />

          {/* Orbiting particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: color || '#FFD700',
                top: '50%',
                left: '50%'
              }}
              animate={{
                x: [0, 30 * Math.cos((i * 120 + 60) * Math.PI / 180)],
                y: [0, 30 * Math.sin((i * 120 + 60) * Math.PI / 180)],
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </motion.div>

        {/* Title */}
        <motion.h3 
          className="text-white font-bold text-lg text-center mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15 + 0.2 }}
        >
          {title}
        </motion.h3>

        {/* Description */}
        <motion.p 
          className="text-white/70 text-sm text-center mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.15 + 0.3 }}
        >
          {description}
        </motion.p>

        {/* Value */}
        {value && (
          <motion.div 
            className="text-center text-4xl font-bold mb-2"
            style={{ color: color || '#FFD700' }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: index * 0.15 + 0.4,
              type: "spring",
              stiffness: 300
            }}
          >
            {value}
          </motion.div>
        )}

        {/* Date */}
        {date && (
          <motion.div 
            className="text-white/40 text-xs text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.15 + 0.5 }}
          >
            {date}
          </motion.div>
        )}

        {/* "New" badge for expanded view */}
        {isNew && (
          <motion.div
            className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ 
              backgroundColor: `${color || '#FFD700'}30`,
              color: color || '#FFD700',
              border: `1px solid ${color || '#FFD700'}50`
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0
            }}
            transition={{ 
              delay: 0.5,
              type: "spring",
              stiffness: 300
            }}
          >
            ✨ NEW
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}