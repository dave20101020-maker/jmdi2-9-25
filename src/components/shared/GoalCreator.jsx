
import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Save, ChevronRight, ChevronLeft, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PILLARS } from '@/utils';
import { toast } from 'sonner';
import HelpTooltip from '@/components/shared/HelpTooltip';
import { goalPrompts } from '@/ai/prompts';

export default function GoalCreator({ onClose, onSuccess, initialGoal, user }) {
  const [step, setStep] = useState(initialGoal ? 2 : 0);
  const [selectedPillar, setSelectedPillar] = useState(initialGoal?.pillar || '');
  const [goalStatement, setGoalStatement] = useState(initialGoal?.goalStatement || '');
  const [linkedPlanId, setLinkedPlanId] = useState(initialGoal?.linkedPlanId || null);
  
  const [specific, setSpecific] = useState(initialGoal?.specific || '');
  const [measurable, setMeasurable] = useState(initialGoal?.measurable || '');
  const [achievable, setAchievable] = useState(initialGoal?.achievable || '');
  const [relevant, setRelevant] = useState(initialGoal?.relevant || '');
  const [timeBound, setTimeBound] = useState(initialGoal?.timeBound || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    async function fetchPlans() {
      if (!user?.email) return;
      try {
        const userPlans = await api.getPlans({ 
          created_by: user.email,
          isActive: true 
        });
        setPlans(userPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load your plans');
      }
    }
    fetchPlans();
  }, [user]);
  
  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 0) {
      if (!selectedPillar) newErrors.pillar = 'Please select a pillar';
    }
    
    if (currentStep === 1) {
      if (!goalStatement.trim()) {
        newErrors.goalStatement = 'Goal statement is required';
      } else if (goalStatement.length < 10) {
        newErrors.goalStatement = 'Goal statement must be at least 10 characters';
      } else if (goalStatement.length > 500) {
        newErrors.goalStatement = 'Goal statement must be less than 500 characters';
      }
    }
    
    if (currentStep === 2) {
      if (!specific.trim()) newErrors.specific = 'Specific is required';
      if (!measurable.trim()) newErrors.measurable = 'Measurable is required';
      if (!timeBound.trim()) newErrors.timeBound = 'Time-bound is required';
      
      if (specific.length > 300) newErrors.specific = 'Must be less than 300 characters';
      if (measurable.length > 300) newErrors.measurable = 'Must be less than 300 characters';
      if (achievable.length > 300) newErrors.achievable = 'Must be less than 300 characters';
      if (relevant.length > 300) newErrors.relevant = 'Must be less than 300 characters';
      if (timeBound.length > 150) newErrors.timeBound = 'Must be less than 150 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (!validateStep(step)) {
      toast.error('Please fix the errors before continuing');
      return;
    }
    
    if (step === 1 && !specific && !isGenerating) {
      handleGenerateSmart();
    } else {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };
  
  const handleGenerateSmart = async () => {
    if (!goalStatement.trim()) {
      toast.error('Please enter a goal statement first');
      return;
    }
    
    setIsGenerating(true);
    const loadingToast = toast.loading('AI is crafting your SMART goal...');
    
    try {
      const prompt = goalPrompts.smartGoal(goalStatement, selectedPillar, PILLARS[selectedPillar].name);

      const result = await api.aiCoach({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            specific: { type: "string" },
            measurable: { type: "string" },
            achievable: { type: "string" },
            relevant: { type: "string" },
            timeBound: { type: "string" }
          },
          required: ["specific", "measurable", "timeBound"]
        }
      });
      
      if (result && typeof result === 'object') {
        setSpecific(result.specific || '');
        setMeasurable(result.measurable || '');
        setAchievable(result.achievable || '');
        setRelevant(result.relevant || '');
        setTimeBound(result.timeBound || '');
        
        toast.dismiss(loadingToast);
        toast.success('SMART goal generated! Review and edit as needed.', {
          icon: '🎯',
          duration: 4000
        });
        setStep(2);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error generating SMART goal:', error);
      toast.dismiss(loadingToast);
      toast.error('AI generation failed. Please fill in the SMART components manually.', {
        description: 'Don\'t worry, you can still create a great goal!',
        duration: 5000
      });
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = async () => {
    if (!validateStep(2)) {
      toast.error('Please fix all validation errors before saving');
      return;
    }
    
    setIsSaving(true);
    const savingToast = toast.loading(initialGoal ? 'Updating goal...' : 'Creating goal...');
    
    try {
      const goalData = {
        pillar: selectedPillar,
        linkedPlanId: linkedPlanId || null,
        goalStatement,
        specific,
        measurable,
        achievable,
        relevant,
        timeBound,
        status: 'active',
        progress: initialGoal?.progress || 0
      };
      
      if (initialGoal) {
        await api.updateGoal(initialGoal.id, goalData);
        toast.dismiss(savingToast);
        toast.success('Goal updated successfully! 🎯', {
          description: 'Keep crushing those goals!',
          duration: 3000
        });
      } else {
        const newGoal = await api.createGoal(goalData);
        
        if (linkedPlanId) {
          const plan = await api.getPlans({ id: linkedPlanId });
          if (plan.length > 0) {
            const currentGoals = plan[0].smartGoalIds || [];
            await api.updatePlan(linkedPlanId, {
              smartGoalIds: [...currentGoals, newGoal.id],
              linkedGoalsCount: (plan[0].linkedGoalsCount || 0) + 1
            });
          }
        }
        
        toast.dismiss(savingToast);
        toast.success('Goal created successfully! 🎉', {
          description: 'Let\'s make it happen!',
          duration: 3000
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.dismiss(savingToast);
      toast.error('Failed to save goal', {
        description: 'Please try again or contact support if the issue persists.',
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const pillar = selectedPillar ? PILLARS[selectedPillar] : null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)' }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {initialGoal ? 'Edit Goal' : 'Create SMART Goal'}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                {step === 0 && 'Choose which pillar this goal supports'}
                {step === 1 && 'Describe your goal in your own words'}
                {step === 2 && 'Define your SMART goal components'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close goal creator"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? 'w-8 bg-[#D4AF37]' : s < step ? 'w-2 bg-[#D4AF37]/50' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
          
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <Label className="text-white mb-3 block">Select a Life Pillar</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PILLARS).map(([id, p]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedPillar(id);
                        setErrors({});
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPillar === id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/20 scale-105'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                      style={selectedPillar === id ? { boxShadow: `0 0 20px ${p.color}40` } : {}}
                    >
                      <div className="text-3xl mb-2">{p.icon}</div>
                      <div className="text-white font-bold">{p.name}</div>
                    </button>
                  ))}
                </div>
                {errors.pillar && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.pillar}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {pillar && (
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-3xl">{pillar.icon}</div>
                  <div>
                    <div className="text-white font-bold">{pillar.name}</div>
                    <div className="text-white/60 text-sm">Selected pillar</div>
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white">Your Goal</Label>
                  <span className={`text-xs ${goalStatement.length > 500 ? 'text-red-400' : 'text-white/60'}`}>
                    {goalStatement.length}/500
                  </span>
                </div>
                <Textarea
                  value={goalStatement}
                  onChange={(e) => {
                    setGoalStatement(e.target.value);
                    setErrors({});
                  }}
                  placeholder="E.g., I want to run a 5K race in under 30 minutes by the end of this year"
                  className={`bg-white/10 border text-white min-h-[120px] ${
                    errors.goalStatement ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {errors.goalStatement && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.goalStatement}
                  </div>
                )}
                <p className="text-white/60 text-xs mt-2">
                  💡 Tip: Be specific about what you want to achieve. Our AI will help make it SMART!
                </p>
              </div>
              
              {plans.length > 0 && (
                <div>
                  <Label className="text-white mb-2 block">Link to a Plan (Optional)</Label>
                  <Select value={linkedPlanId || 'none'} onValueChange={(val) => setLinkedPlanId(val === 'none' ? null : val)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="No plan selected" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No plan</SelectItem>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.planTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                <p className="text-white/90 text-sm flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>
                    AI has generated SMART components for your goal. Review and edit them to make them perfect for you!
                  </span>
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-green-400 font-bold flex items-center gap-2">
                    Specific
                    <HelpTooltip
                      title="What exactly will you accomplish?"
                      content="Be clear and concrete about what you want to achieve. Avoid vague language."
                      position="right"
                    />
                  </Label>
                  <span className={`text-xs ml-auto ${specific.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                    {specific.length}/300
                  </span>
                </div>
                <Textarea
                  value={specific}
                  onChange={(e) => {
                    setSpecific(e.target.value);
                    setErrors({});
                  }}
                  placeholder="What exactly will you accomplish?"
                  className={`bg-white/10 border text-white min-h-[80px] ${
                    errors.specific ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {errors.specific && (
                  <div className="flex items-center gap-2 mt-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {errors.specific}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-blue-400 font-bold flex items-center gap-2">
                    Measurable
                    <HelpTooltip
                      title="How will you track progress?"
                      content="Define metrics, numbers, or milestones to measure your progress."
                      position="right"
                    />
                  </Label>
                  <span className={`text-xs ml-auto ${measurable.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                    {measurable.length}/300
                  </span>
                </div>
                <Textarea
                  value={measurable}
                  onChange={(e) => {
                    setMeasurable(e.target.value);
                    setErrors({});
                  }}
                  placeholder="How will you measure progress?"
                  className={`bg-white/10 border text-white min-h-[80px] ${
                    errors.measurable ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {errors.measurable && (
                  <div className="flex items-center gap-2 mt-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {errors.measurable}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-purple-400 font-bold flex items-center gap-2">
                    Achievable (Optional)
                    <HelpTooltip
                      title="Why is this realistic?"
                      content="Consider your resources, constraints, and current situation."
                      position="right"
                    />
                  </Label>
                  <span className={`text-xs ml-auto ${achievable.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                    {achievable.length}/300
                  </span>
                </div>
                <Textarea
                  value={achievable}
                  onChange={(e) => setAchievable(e.target.value)}
                  placeholder="Why is this realistic for you?"
                  className="bg-white/10 border-white/20 text-white min-h-[70px]"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-yellow-400 font-bold flex items-center gap-2">
                    Relevant (Optional)
                    <HelpTooltip
                      title="Why does this matter?"
                      content="Connect it to your values, bigger picture, or life pillars."
                      position="right"
                    />
                  </Label>
                  <span className={`text-xs ml-auto ${relevant.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                    {relevant.length}/300
                  </span>
                </div>
                <Textarea
                  value={relevant}
                  onChange={(e) => setRelevant(e.target.value)}
                  placeholder="Why does this matter to you?"
                  className="bg-white/10 border-white/20 text-white min-h-[70px]"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-orange-400 font-bold flex items-center gap-2">
                    Time-bound
                    <HelpTooltip
                      title="When will you achieve this?"
                      content="Set a realistic deadline or timeframe for completion."
                      position="right"
                    />
                  </Label>
                  <span className={`text-xs ml-auto ${timeBound.length > 150 ? 'text-red-400' : 'text-white/60'}`}>
                    {timeBound.length}/150
                  </span>
                </div>
                <Input
                  value={timeBound}
                  onChange={(e) => {
                    setTimeBound(e.target.value);
                    setErrors({});
                  }}
                  placeholder="Target date or timeframe"
                  className={`bg-white/10 border text-white ${
                    errors.timeBound ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {errors.timeBound && (
                  <div className="flex items-center gap-2 mt-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {errors.timeBound}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            {step > 0 && (
              <Button
                onClick={handleBack}
                variant="ghost"
                className="border border-white/20 text-white hover:bg-white/10 hover:text-white"
                disabled={isGenerating || isSaving}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {step < 2 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] hover:text-[#0A1628] font-bold"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {step === 1 && !specific ? 'Generate SMART Goal' : 'Continue'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] hover:text-[#0A1628] font-bold"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {initialGoal ? 'Update Goal' : 'Create Goal'}
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
