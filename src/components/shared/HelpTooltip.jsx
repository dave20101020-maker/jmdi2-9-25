import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HelpTooltip({ content, title, position = "top" }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 transition-all group"
        aria-label="Show help"
      >
        <HelpCircle className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-50 w-80 max-w-[90vw] ${positionClasses[position]} md:static md:absolute md:w-80`}
            >
              <div className="bg-[#1a1f35] border-2 border-blue-500/40 rounded-xl p-4 shadow-2xl"
                style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  {title && (
                    <h4 className="text-white font-bold text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-400" />
                      {title}
                    </h4>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white transition-colors ml-2"
                    aria-label="Close help"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-white/80 text-sm leading-relaxed">
                  {content}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}