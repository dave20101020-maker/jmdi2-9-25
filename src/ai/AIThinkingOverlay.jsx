import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Stars, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const MOTIVATIONAL_QUOTES = [
  "Small steps lead to big transformations...",
  "Your journey to better health starts now...",
  "Every day is a chance to grow stronger...",
  "Building habits that last a lifetime...",
  "Progress, not perfection...",
  "You're investing in your future self...",
  "One step at a time, you've got this...",
  "Creating your personalized roadmap...",
  "Your wellness journey is unique...",
  "Sustainable change takes time and patience...",
  "You're worth the effort...",
  "Great things are coming together..."
];

export default function AIThinkingOverlay({ isVisible, message = "NorthStar is crafting your plan...", onComplete }) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible && isExiting) {
      // Trigger confetti burst
      const duration = 200;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 20, zIndex: 1000 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          setIsExiting(false);
          return;
        }

        const particleCount = 20 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isVisible, isExiting]);

  const handleExit = () => {
    setIsExiting(true);
  };

  return (
    <AnimatePresence onExitComplete={handleExit}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1628]/95 backdrop-blur-md"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {/* Animated stars background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md mx-4"
            style={{ boxShadow: '0 0 60px rgba(212, 175, 55, 0.4)' }}
          >
            {/* Spinning icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center"
                style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.6)' }}
              >
                <Sparkles className="w-6 h-6 text-[#0A1628]" />
              </motion.div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-bold text-white text-center mb-4">
              {message}
            </h3>

            {/* Shimmer progress bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-6">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            {/* Rotating motivational quote */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-white/70 text-sm italic">
                  {MOTIVATIONAL_QUOTES[currentQuoteIndex]}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Decorative elements */}
            <div className="absolute -top-3 -left-3 text-[#D4AF37] opacity-20">
              <Stars className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-3 -right-3 text-[#F4D03F] opacity-20">
              <Zap className="w-8 h-8" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}