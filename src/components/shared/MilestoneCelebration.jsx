import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

const MILESTONE_MESSAGES = {
  7: {
    title: "7-Day Streak! 🎉",
    message: "You're building lasting habits! A full week of dedication.",
    badge: "🥉"
  },
  14: {
    title: "2-Week Streak! 🌟",
    message: "Incredible consistency! You're in the top 20% of users.",
    badge: "🥈"
  },
  30: {
    title: "30-Day Streak! 🏆",
    message: "One month of excellence! You're a habit master.",
    badge: "🥇"
  },
  60: {
    title: "60-Day Streak! 💎",
    message: "Two months strong! You're unstoppable.",
    badge: "💎"
  },
  100: {
    title: "100-Day Streak! 👑",
    message: "LEGENDARY! You're in the elite 1% of users.",
    badge: "👑"
  },
  365: {
    title: "1-Year Streak! 🌟",
    message: "AN ENTIRE YEAR! You're a NorthStar champion!",
    badge: "⭐"
  }
};

export default function MilestoneCelebration({ milestone, onClose }) {
  const [showConfetti, setShowConfetti] = useState(true);
  
  const milestoneData = MILESTONE_MESSAGES[milestone] || {
    title: `${milestone}-Day Streak!`,
    message: "Amazing achievement! Keep going!",
    badge: "🎊"
  };
  
  useEffect(() => {
    if (showConfetti) {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;
      
      const colors = ['#D4AF37', '#F4D03F', '#FFD700', '#FFA500'];
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
      
      // Stop confetti after duration
      setTimeout(() => setShowConfetti(false), duration);
    }
  }, [showConfetti]);
  
  const handleShare = () => {
    const text = `I just hit a ${milestone}-day streak on NorthStar! 🌟 Building lasting habits every day.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'NorthStar Milestone',
        text: text,
        url: window.location.origin
      }).catch(() => {});
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard! Share your achievement.');
      });
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: 'rgba(10, 22, 40, 0.95)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="max-w-md w-full bg-gradient-to-br from-[#1a1f35] to-[#0A1628] border-2 border-[#D4AF37] rounded-3xl p-8 text-center relative overflow-hidden"
          style={{ boxShadow: '0 0 60px rgba(212, 175, 55, 0.6)' }}
        >
          {/* Animated background stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-[#D4AF37] rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            aria-label="Close celebration"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-8xl mb-4"
          >
            {milestoneData.badge}
          </motion.div>
          
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            {milestoneData.title}
          </motion.h2>
          
          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/80 mb-6"
          >
            {milestoneData.message}
          </motion.p>
          
          {/* Trophy icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
          >
            <Trophy className="w-10 h-10 text-[#0A1628]" />
          </motion.div>
          
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            <Button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Achievement
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}