import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function PointsAnimation({ points, show, onComplete }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.5 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(212, 175, 55, 0.8)' }}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-3xl font-bold">+{points}</span>
            <span className="text-xl">⭐</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}