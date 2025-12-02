import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Sparkles, RefreshCw } from "lucide-react";

export default function PillarTip({ 
  tips = [],
  color = "#D4AF37",
  icon: CustomIcon,
  title = "Pro Tip"
}) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Get tip based on current date (changes daily)
  useEffect(() => {
    if (tips.length === 0) return;
    
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const index = dayOfYear % tips.length;
    setCurrentTipIndex(index);
  }, [tips.length]);

  const handleRefresh = () => {
    if (tips.length <= 1) return;
    
    setIsRotating(true);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      setIsRotating(false);
    }, 300);
  };

  if (tips.length === 0) return null;

  const currentTip = tips[currentTipIndex];
  const Icon = CustomIcon || Lightbulb;

  return (
    <motion.div
      className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-5 overflow-hidden"
      style={{ 
        boxShadow: `0 0 25px ${color}20`,
        borderColor: `${color}30`
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${color} 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${color} 0%, transparent 50%)`
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + (i % 2) * 40}%`
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.8
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color }} />
          </motion.div>
        ))}
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${color}20`,
                border: `1px solid ${color}40`
              }}
              animate={{
                boxShadow: [
                  `0 0 10px ${color}40`,
                  `0 0 20px ${color}60`,
                  `0 0 10px ${color}40`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </motion.div>
            <h3 className="text-white font-bold">{title}</h3>
          </div>

          {/* Refresh button */}
          {tips.length > 1 && (
            <motion.button
              onClick={handleRefresh}
              className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isRotating}
            >
              <motion.div
                animate={{ rotate: isRotating ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </motion.button>
          )}
        </div>

        {/* Tip content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTipIndex}
            initial={{ opacity: 0, x: 20, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -20, rotateY: 10 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            {/* Tip emoji/icon */}
            {currentTip.emoji && (
              <motion.div 
                className="text-3xl mb-2"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 400,
                  delay: 0.1
                }}
              >
                {currentTip.emoji}
              </motion.div>
            )}

            {/* Tip text */}
            <p className="text-white/90 text-sm leading-relaxed mb-2">
              {currentTip.text}
            </p>

            {/* Optional source or category */}
            {currentTip.category && (
              <motion.div
                className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-2"
                style={{ 
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `1px solid ${color}30`
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentTip.category}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tip counter */}
        {tips.length > 1 && (
          <motion.div 
            className="absolute bottom-3 right-3 text-white/40 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {currentTipIndex + 1} / {tips.length}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}