
import { api } from "@/utils/apiClient";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Compass, Sparkles, Plus, Trash2, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const COMMON_VALUES = [
  "authenticity", "compassion", "creativity", "family", "freedom",
  "growth", "health", "honesty", "integrity", "justice",
  "kindness", "knowledge", "love", "peace", "service",
  "spirituality", "stability", "success", "wisdom", "balance"
];

const EXERCISE_TYPES = [
  {
    id: "core_values",
    name: "Core Values Identification",
    description: "Discover what truly matters to you",
    emoji: "🎯"
  },
  {
    id: "life_purpose",
    name: "Life Purpose Exploration",
    description: "Articulate your deeper purpose",
    emoji: "⭐"
  },
  {
    id: "integrity_check",
    name: "Integrity Check",
    description: "Align actions with values",
    emoji: "⚖️"
  },
  {
    id: "priorities_alignment",
    name: "Priorities Alignment",
    description: "Ensure your time reflects your values",
    emoji: "🧭"
  }
];

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
};

export default function ValuesExercise({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [exerciseType, setExerciseType] = useState("core_values");
  const [exercise, setExercise] = useState({
    topValues: [],
    lifePurpose: "",
    integrityGaps: [],
    aiInsights: "",
    actionCommitments: []
  });
  const [saving, setSaving] = useState(false);
  const [gettingAI, setGettingAI] = useState(false);
  
  const [valueInput, setValueInput] = useState("");
  const [whyInput, setWhyInput] = useState("");
  const [actionInput, setActionInput] = useState("");

  const addValue = (value = valueInput) => {
    if (value.trim() && exercise.topValues.length < 5) {
      setExercise({
        ...exercise,
        topValues: [
          ...exercise.topValues,
          { value: value.trim(), rank: exercise.topValues.length + 1, why: "" }
        ]
      });
      setValueInput("");
    }
  };

  const updateValueWhy = (index, why) => {
    const newValues = [...exercise.topValues];
    newValues[index].why = why;
    setExercise({ ...exercise, topValues: newValues });
  };

  const removeValue = (index) => {
    setExercise({
      ...exercise,
      topValues: exercise.topValues.filter((_, i) => i !== index).map((v, i) => ({
        ...v,
        rank: i + 1
      }))
    });
  };

  const addActionCommitment = () => {
    if (actionInput.trim()) {
      setExercise({
        ...exercise,
        actionCommitments: [...exercise.actionCommitments, actionInput.trim()]
      });
      setActionInput("");
    }
  };

  const getAIInsights = async () => {
    if (exercise.topValues.length === 0 && exerciseType === "core_values") {
      toast.error("Please add at least one value first");
      return;
    }
    if (!exercise.lifePurpose.trim() && exerciseType === "life_purpose") {
      toast.error("Please articulate your life purpose first");
      return;
    }

    setGettingAI(true);
    try {
      let prompt = `As a wise spiritual guide, provide insights on these personal reflections:`;
      if (exerciseType === "core_values" && exercise.topValues.length > 0) {
        const valuesList = exercise.topValues.map(v => `${v.value} (${v.why || 'no reason given'})`).join(', ');
        prompt += `\n\nCore Values: ${valuesList}`;
      }
      if (exerciseType === "life_purpose" && exercise.lifePurpose.trim()) {
        prompt += `\n\nLife Purpose: ${exercise.lifePurpose}`;
      }
      
      prompt += `\n\nProvide:
1. A thoughtful reflection on how these insights work together (2-3 sentences)
2. One potential value conflict or tension to be aware of (if values are present) or a challenge in pursuing life purpose.
3. A specific practice to honor these insights daily

Return ONLY valid JSON:
{
  "reflection": "reflection here",
  "potentialTension": "tension observation",
  "dailyPractice": "specific practice"
}`;

      const result = await api.aiCoach({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            reflection: { type: "string" },
            potentialTension: { type: "string" },
            dailyPractice: { type: "string" }
          }
        }
      });

      setExercise({
        ...exercise,
        aiInsights: `${result.reflection}\n\nTension to Watch: ${result.potentialTension}\n\nDaily Practice: ${result.dailyPractice}`
      });
      setGettingAI(false);
      toast.success('AI insights generated! ✨');
    } catch (error) {
      console.error('Error getting AI insights:', error);
      setGettingAI(false);
      toast.error('Failed to generate insights');
    }
  };

  const handleSave = async () => {
    if (exerciseType === "core_values" && exercise.topValues.length === 0) {
      toast.error('Please identify at least one core value');
      return;
    }

    if (exerciseType === "life_purpose" && !exercise.lifePurpose.trim()) {
      toast.error('Please articulate your life purpose');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        exerciseType,
        ...exercise
      });
      toast.success('Values exercise saved! 🌟');
      onClose(); // Close after successful save
    } catch (error) {
      toast.error('Failed to save exercise');
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between z-10">
            <motion.h2 
              className="text-2xl font-bold text-white flex items-center gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Compass className="w-7 h-7 text-purple-400" />
              Values Clarification
            </motion.h2>
            <motion.button 
              onClick={onClose} 
              className="text-white/60 hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              {/* Exercise Type Selection */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  className="space-y-4"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                >
                  <motion.h3 className="text-xl font-bold text-white mb-4" variants={fadeInUp}>
                    Choose an Exercise
                  </motion.h3>
                  <motion.div className="grid md:grid-cols-2 gap-4" variants={staggerContainer}>
                    {EXERCISE_TYPES.map((type, idx) => (
                      <motion.button
                        key={type.id}
                        onClick={() => {
                          setExerciseType(type.id);
                          setStep(2);
                        }}
                        className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all text-left group"
                        variants={fadeInUp}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div 
                          className="text-4xl mb-3"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: idx * 0.1 + 0.2, type: "spring" }}
                        >
                          {type.emoji}
                        </motion.div>
                        <h4 className="text-white font-bold mb-1">{type.name}</h4>
                        <p className="text-white/60 text-sm">{type.description}</p>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Core Values Exercise */}
              {step === 2 && exerciseType === "core_values" && (
                <motion.div 
                  key="step2-core"
                  className="space-y-6"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h3 className="text-xl font-bold text-white">Identify Your Core Values</h3>
                  <p className="text-white/70 text-sm">
                    Choose 3-5 values that are most important to you. What principles guide your decisions?
                  </p>

                  <div>
                    <Label className="text-white mb-3 block">Quick Select Common Values</Label>
                    <motion.div 
                      className="flex flex-wrap gap-2 mb-4"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {COMMON_VALUES.map((value, idx) => (
                        <motion.button
                          key={value}
                          onClick={() => addValue(value)}
                          disabled={exercise.topValues.length >= 5}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all capitalize text-sm disabled:opacity-50"
                          variants={fadeInUp}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {value}
                        </motion.button>
                      ))}
                    </motion.div>

                    <div className="flex gap-2 mb-4">
                      <Input
                        value={valueInput}
                        onChange={(e) => setValueInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addValue()}
                        placeholder="Or type your own value..."
                        className="bg-white/10 border-white/20 text-white flex-1"
                        disabled={exercise.topValues.length >= 5}
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => addValue()}
                          disabled={exercise.topValues.length >= 5}
                          size="sm"
                          className="bg-purple-500/20 text-purple-400 border border-purple-500/40"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {exercise.topValues.length > 0 && (
                    <AnimatePresence mode="popLayout">
                      <motion.div className="space-y-3" layout>
                        <Label className="text-white block">Your Values ({exercise.topValues.length}/5)</Label>
                        {exercise.topValues.map((value, idx) => (
                          <motion.div 
                            key={value.value} // Use a unique key for list items, ideally value.id if available, otherwise value.value
                            className="bg-white/5 border border-white/10 rounded-xl p-4"
                            initial={{ opacity: 0, height: 0, x: -20 }}
                            animate={{ opacity: 1, height: "auto", x: 0 }}
                            exit={{ opacity: 0, height: 0, x: 20, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            layout
                          >
                            <div className="flex items-start gap-3">
                              <motion.div 
                                className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold flex-shrink-0"
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                transition={{ type: "spring", stiffness: 500, damping: 10 }}
                              >
                                {value.rank}
                              </motion.div>
                              <div className="flex-1 space-y-2">
                                <div className="text-white font-bold capitalize">{value.value}</div>
                                <Input
                                  value={value.why}
                                  onChange={(e) => updateValueWhy(idx, e.target.value)}
                                  placeholder="Why is this important to you?"
                                  className="bg-white/10 border-white/20 text-white text-sm"
                                />
                              </div>
                              <motion.button
                                onClick={() => removeValue(idx)}
                                className="text-red-400 hover:text-red-300"
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {/* Life Purpose Exercise */}
              {step === 2 && exerciseType === "life_purpose" && (
                <motion.div 
                  key="step2-purpose"
                  className="space-y-6"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h3 className="text-xl font-bold text-white">Explore Your Life Purpose</h3>
                  <p className="text-white/70 text-sm">
                    If you could dedicate your life to one meaningful pursuit, what would it be?
                  </p>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                    <div className="text-purple-400 text-sm mb-2">Guiding Questions:</div>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• What brings you deep fulfillment?</li>
                      <li>• What impact do you want to have on the world?</li>
                      <li>• What would you do if money wasn't a concern?</li>
                      <li>• What do you want to be remembered for?</li>
                    </ul>
                  </div>

                  <Textarea
                    value={exercise.lifePurpose}
                    onChange={(e) => setExercise({ ...exercise, lifePurpose: e.target.value })}
                    placeholder="My life purpose is..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    rows={6}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Insights Section */}
            {step === 2 && (exerciseType === "core_values" || exerciseType === "life_purpose") && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={getAIInsights}
                    disabled={gettingAI}
                    className="w-full bg-purple-500/20 text-purple-400 border border-purple-500/40 mb-4"
                  >
                    <Lightbulb className={`w-4 h-4 mr-2 ${gettingAI ? 'animate-pulse' : ''}`} />
                    {gettingAI ? 'Getting AI Insights...' : 'Get AI Insights'}
                  </Button>
                </motion.div>

                <AnimatePresence>
                  {exercise.aiInsights && (
                    <motion.div 
                      className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
                      initial={{ opacity: 0, height: 0, y: 10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h4 className="text-white font-bold">AI Insights</h4>
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-line">{exercise.aiInsights}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Action Commitments */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Label className="text-white mb-2 block">Action Commitments</Label>
                <p className="text-white/60 text-sm mb-3">
                  How will you live by these values this week?
                </p>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addActionCommitment()}
                    placeholder="I commit to..."
                    className="bg-white/10 border-white/20 text-white flex-1"
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={addActionCommitment}
                      size="sm"
                      className="bg-green-500/20 text-green-400 border border-green-500/40"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
                <AnimatePresence mode="popLayout">
                  {exercise.actionCommitments.length > 0 && (
                    <motion.div className="space-y-2">
                      {exercise.actionCommitments.map((action, idx) => (
                        <motion.div 
                          key={action} // Using action as key, assuming unique actions
                          className="flex items-start gap-2 bg-white/5 rounded-lg p-3"
                          initial={{ opacity: 0, x: -20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          layout
                        >
                          <span className="text-green-400">•</span>
                          <span className="text-white/80 text-sm flex-1">{action}</span>
                          <motion.button
                            onClick={() => setExercise({
                              ...exercise,
                              actionCommitments: exercise.actionCommitments.filter((_, i) => i !== idx)
                            })}
                            className="text-red-400 hover:text-red-300"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Navigation */}
            <motion.div 
              className="flex gap-3 pt-6 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {step === 2 && (
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Exercise'}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
