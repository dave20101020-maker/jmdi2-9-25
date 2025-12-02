import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Sparkles, Plus, Trash2, Heart, Clock, Bell } from "lucide-react";
import { toast } from "sonner";

const GRATITUDE_CATEGORIES = [
  { value: "people", label: "People", emoji: "👥", color: "#FFD700" },
  { value: "experiences", label: "Experiences", emoji: "✨", color: "#7C3AED" },
  { value: "things", label: "Things", emoji: "🎁", color: "#52B788" },
  { value: "nature", label: "Nature", emoji: "🌿", color: "#4CC9F0" },
  { value: "self", label: "Self", emoji: "💫", color: "#FF69B4" },
  { value: "growth", label: "Growth", emoji: "🌱", color: "#52B788" },
  { value: "health", label: "Health", emoji: "❤️", color: "#FF5733" },
  { value: "other", label: "Other", emoji: "🙏", color: "#9370DB" }
];

// Modal animation variants - optimized for performance
const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      mass: 0.5
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

export default function GratitudeLogger({ onClose, onSave, initialEntry = null }) {
  const [entry, setEntry] = useState(initialEntry || {
    gratitudes: [
      { text: "", category: "people" },
      { text: "", category: "experiences" },
      { text: "", category: "things" }
    ],
    reflectionNote: "",
    mood: 8,
    reminderTime: "20:00"
  });
  const [saving, setSaving] = useState(false);

  const updateGratitude = (index, field, value) => {
    const newGratitudes = [...entry.gratitudes];
    newGratitudes[index][field] = value;
    setEntry({ ...entry, gratitudes: newGratitudes });
  };

  const addGratitude = () => {
    setEntry({
      ...entry,
      gratitudes: [...entry.gratitudes, { text: "", category: "other" }]
    });
  };

  const removeGratitude = (index) => {
    if (entry.gratitudes.length > 1) {
      setEntry({
        ...entry,
        gratitudes: entry.gratitudes.filter((_, i) => i !== index)
      });
    }
  };

  const handleSave = async () => {
    const validGratitudes = entry.gratitudes.filter(g => g.text.trim());
    
    if (validGratitudes.length === 0) {
      toast.error('Please add at least one thing you\'re grateful for');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...entry,
        gratitudes: validGratitudes
      });
      toast.success('Gratitude saved! 🙏');
    } catch (error) {
      toast.error('Failed to save gratitude');
      setSaving(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <motion.h2 
            className="text-2xl font-bold text-white flex items-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="w-7 h-7 text-[#FFD700]" />
            Gratitude Practice
          </motion.h2>
          <motion.button 
            onClick={onClose} 
            className="text-white/60 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded-lg p-2"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.div 
          className="p-6 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Intro Message */}
          <motion.div 
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4"
            variants={itemVariants}
          >
            <p className="text-white/80 text-sm">
              <Heart className="w-4 h-4 inline text-pink-400 mr-2" />
              Take a moment to acknowledge the good in your life. Research shows gratitude improves mood, sleep, and overall wellbeing.
            </p>
          </motion.div>

          {/* Gratitude Items */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">What are you grateful for today?</Label>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={addGratitude}
                  size="sm"
                  className="bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More
                </Button>
              </motion.div>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div className="space-y-4" layout>
                {entry.gratitudes.map((gratitude, idx) => (
                  <motion.div 
                    key={idx}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, scale: 0.8 }}
                    transition={{ 
                      type: "spring",
                      damping: 25,
                      stiffness: 300
                    }}
                    layout
                  >
                    <div className="flex items-start gap-3">
                      <motion.div 
                        className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-lg flex-shrink-0"
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {idx + 1}
                      </motion.div>
                      <div className="flex-1 space-y-3">
                        <Input
                          value={gratitude.text}
                          onChange={(e) => updateGratitude(idx, 'text', e.target.value)}
                          placeholder="I'm grateful for..."
                          className="bg-white/10 border-white/20 text-white transition-all focus:scale-[1.01]"
                        />
                        <motion.div 
                          className="flex flex-wrap gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {GRATITUDE_CATEGORIES.map((cat, catIdx) => (
                            <motion.button
                              key={cat.value}
                              onClick={() => updateGratitude(idx, 'category', cat.value)}
                              className={`px-3 py-1.5 rounded-lg border transition-all text-xs ${
                                gratitude.category === cat.value
                                  ? 'border-2 scale-105'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }`}
                              style={gratitude.category === cat.value ? {
                                backgroundColor: `${cat.color}20`,
                                borderColor: cat.color,
                                color: cat.color
                              } : { color: 'rgba(255,255,255,0.7)' }}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: catIdx * 0.02 }}
                            >
                              {cat.emoji} {cat.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      </div>
                      {entry.gratitudes.length > 1 && (
                        <motion.button
                          onClick={() => removeGratitude(idx)}
                          className="text-red-400 hover:text-red-300 mt-2"
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Reflection Note */}
          <motion.div variants={itemVariants}>
            <Label className="text-white mb-2 block">Deeper Reflection (Optional)</Label>
            <Textarea
              value={entry.reflectionNote}
              onChange={(e) => setEntry({ ...entry, reflectionNote: e.target.value })}
              placeholder="How does gratitude shift your perspective? What patterns do you notice?"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 transition-all focus:scale-[1.005]"
              rows={3}
            />
          </motion.div>

          {/* Mood After */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">How do you feel now?</Label>
              <motion.span 
                className="text-[#FFD700] font-bold text-lg"
                key={entry.mood}
                initial={{ scale: 1.2, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {entry.mood}/10
              </motion.span>
            </div>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, idx) => (
                <motion.button
                  key={num}
                  onClick={() => setEntry({ ...entry, mood: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-xs md:text-sm ${
                    entry.mood === num
                      ? 'bg-[#FFD700] text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Daily Reminder */}
          <motion.div 
            className="bg-white/5 border border-white/10 rounded-xl p-4"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <Label className="text-white">Daily Gratitude Reminder</Label>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-white/60" />
              <Input
                type="time"
                value={entry.reminderTime}
                onChange={(e) => setEntry({ ...entry, reminderTime: e.target.value })}
                className="bg-white/10 border-white/20 text-white w-32"
              />
              <span className="text-white/60 text-sm">We'll remind you daily at this time</span>
            </div>
          </motion.div>

          {/* Tips */}
          <motion.div 
            className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
            variants={itemVariants}
          >
            <p className="text-white/70 text-sm">
              💡 <strong>Tip:</strong> Be specific and vivid. Instead of "my family," try "my mom's laugh when I told her about my day."
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex gap-3 pt-4"
            variants={itemVariants}
          >
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Gratitude'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}