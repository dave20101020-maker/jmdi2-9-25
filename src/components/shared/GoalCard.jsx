
import { api } from "@/utils/apiClient";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Save, X, Copy, Archive, AlertCircle, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PILLARS } from '@/components/shared/Utils';

export default function GoalCard({ goal, onEdit, onUpdateStatus, onUpdateProgress, onDelete, compact = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit fields
  const [editSpecific, setEditSpecific] = useState(goal.specific || '');
  const [editMeasurable, setEditMeasurable] = useState(goal.measurable || '');
  const [editAchievable, setEditAchievable] = useState(goal.achievable || '');
  const [editRelevant, setEditRelevant] = useState(goal.relevant || '');
  const [editTimeBound, setEditTimeBound] = useState(goal.timeBound || '');
  
  // Validation
  const [errors, setErrors] = useState({});
  
  const pillar = PILLARS[goal.pillar];
  
  const handleExpand = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setIsExpanded(true);
    setEditSpecific(goal.specific || '');
    setEditMeasurable(goal.measurable || '');
    setEditAchievable(goal.achievable || '');
    setEditRelevant(goal.relevant || '');
    setEditTimeBound(goal.timeBound || '');
    setErrors({});
  };
  
  const validateFields = () => {
    const newErrors = {};
    
    if (!editSpecific.trim()) newErrors.specific = 'Specific is required';
    if (!editMeasurable.trim()) newErrors.measurable = 'Measurable is required';
    if (!editTimeBound.trim()) newErrors.timeBound = 'Time-bound is required';
    
    if (editSpecific.length > 300) newErrors.specific = 'Max 300 characters';
    if (editMeasurable.length > 300) newErrors.measurable = 'Max 300 characters';
    if (editAchievable.length > 300) newErrors.achievable = 'Max 300 characters';
    if (editRelevant.length > 300) newErrors.relevant = 'Max 300 characters';
    if (editTimeBound.length > 150) newErrors.timeBound = 'Max 150 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateFields()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await api.updateGoal(goal.id, {
        specific: editSpecific,
        measurable: editMeasurable,
        achievable: editAchievable,
        relevant: editRelevant,
        timeBound: editTimeBound
      });
      
      setIsEditing(false);
      toast.success('Goal updated! 🎯');
      onEdit?.(goal);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
    
    setIsSaving(false);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };
  
  const handleDuplicate = async () => {
    try {
      await api.createGoal({
        pillar: goal.pillar,
        linkedPlanId: goal.linkedPlanId,
        goalStatement: `${goal.goalStatement} (Copy)`,
        specific: goal.specific,
        measurable: goal.measurable,
        achievable: goal.achievable,
        relevant: goal.relevant,
        timeBound: goal.timeBound,
        status: 'active',
        progress: 0
      });
      
      toast.success('Goal duplicated! 📋');
      onEdit?.(goal);
    } catch (error) {
      console.error('Error duplicating goal:', error);
      toast.error('Failed to duplicate goal');
    }
  };
  
  const handleArchive = async () => {
    try {
      await api.updateGoal(goal.id, {
        status: goal.status === 'paused' ? 'active' : 'paused'
      });
      
      toast.success(goal.status === 'paused' ? 'Goal reactivated! ✨' : 'Goal archived 📦');
      onUpdateStatus?.(goal.id, goal.status === 'paused' ? 'active' : 'paused');
    } catch (error) {
      console.error('Error archiving goal:', error);
      toast.error('Failed to archive goal');
    }
  };
  
  const handleDelete = async () => {
    const confirmMessage = goal.linkedPlanId 
      ? 'Delete this goal? This will also unlink it from any plans and habits.'
      : 'Delete this goal permanently? This action cannot be undone.';
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      if (goal.linkedHabitsCount > 0) {
        const habits = await api.getHabits({ linkedGoalId: goal.id });
        const updatePromises = habits.map(habit => 
          api.updateHabit(habit.id, { linkedGoalId: null })
        );
        await Promise.all(updatePromises);
      }
      
      if (goal.linkedPlanId) {
        const plan = await api.getPlans({ id: goal.linkedPlanId });
        if (plan.length > 0) {
          const currentGoals = plan[0].smartGoalIds || [];
          const updatedGoals = currentGoals.filter(id => id !== goal.id);
          await api.updatePlan(goal.linkedPlanId, {
            smartGoalIds: updatedGoals,
            linkedGoalsCount: Math.max(0, (plan[0].linkedGoalsCount || 0) - 1)
          });
        }
      }
      
      await api.deleteGoal(goal.id);
      
      toast.success('Goal deleted successfully');
      onDelete?.(goal.id);
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };
  
  const handleProgressClick = () => {
    if (!isEditing) {
      const newProgress = prompt(`Update progress (0-100):`, goal.progress || 0);
      if (newProgress !== null) {
        const progress = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
        onUpdateProgress?.(goal.id, progress);
      }
    }
  };

  if (compact) {
    return (
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
        onClick={handleExpand}
        style={{ boxShadow: `0 0 15px ${pillar.color}20` }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        layout
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${pillar.color}20` }}
              >
                {pillar.icon}
              </div>
              <h3 className="text-white font-bold text-sm">{pillar.name}</h3>
            </div>
            <p className="text-white/80 text-sm italic line-clamp-2">"{goal.goalStatement}"</p>
          </div>
          
          <div className="flex items-center gap-2 ml-3">
            <div className="text-right">
              <motion.div 
                className="text-sm text-white/60"
                key={goal.progress}
                initial={{ scale: 1.2, color: "#D4AF37" }}
                animate={{ scale: 1, color: "rgba(255,255,255,0.6)" }}
                transition={{ type: "spring" }}
              >
                {goal.progress}%
              </motion.div>
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] progress-bar-animated"
                  style={{ width: `${goal.progress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all"
      style={{ boxShadow: `0 0 20px ${pillar.color}30` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300 }}
      layout
    >
      <motion.button
        onClick={handleExpand}
        className="w-full text-left p-5 hover:bg-white/5 transition-all"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `${pillar.color}20`,
                  boxShadow: `0 0 10px ${pillar.color}40`
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {pillar.icon}
              </motion.div>
              <div>
                <h3 className="text-white font-bold">{pillar.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <motion.span 
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      goal.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      goal.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-white/20 text-white/60'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {goal.status}
                  </motion.span>
                </div>
              </div>
            </div>
            
            <p className="text-white/90 italic mb-3">"{goal.goalStatement}"</p>
            
            <motion.div 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleProgressClick();
              }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">Progress</span>
                <motion.span 
                  className="text-sm font-bold text-white"
                  key={goal.progress}
                  initial={{ scale: 1.3, color: "#D4AF37" }}
                  animate={{ scale: 1, color: "#fff" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {goal.progress}%
                </motion.span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] progress-bar-animated"
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 20,
                    mass: 0.5
                  }}
                />
              </div>
            </motion.div>
          </div>
          
          <div className="ml-4 flex flex-col items-end gap-2">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-white/60" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/60" />
              )}
            </motion.div>
            {!isEditing && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                aria-label="Edit goal"
                className="text-white/60 hover:text-[#D4AF37] transition-colors"
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-t border-white/10"
          >
            <div className="p-5 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-green-400 font-bold">Specific</Label>
                      <span className={`text-xs ${editSpecific.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                        {editSpecific.length}/300
                      </span>
                    </div>
                    <Input
                      value={editSpecific}
                      onChange={(e) => setEditSpecific(e.target.value)}
                      placeholder="What exactly will be accomplished?"
                      className={`bg-white/10 border text-white ${
                        errors.specific ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {errors.specific && (
                      <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.specific}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-blue-400 font-bold">Measurable</Label>
                      <span className={`text-xs ${editMeasurable.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                        {editMeasurable.length}/300
                      </span>
                    </div>
                    <Input
                      value={editMeasurable}
                      onChange={(e) => setEditMeasurable(e.target.value)}
                      placeholder="How will you measure progress?"
                      className={`bg-white/10 border text-white ${
                        errors.measurable ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {errors.measurable && (
                      <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.measurable}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-purple-400 font-bold">Achievable</Label>
                      <span className={`text-xs ${editAchievable.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                        {editAchievable.length}/300
                      </span>
                    </div>
                    <Input
                      value={editAchievable}
                      onChange={(e) => setEditAchievable(e.target.value)}
                      placeholder="Why is this realistic for you?"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-yellow-400 font-bold">Relevant</Label>
                      <span className={`text-xs ${editRelevant.length > 300 ? 'text-red-400' : 'text-white/60'}`}>
                        {editRelevant.length}/300
                      </span>
                    </div>
                    <Input
                      value={editRelevant}
                      onChange={(e) => setEditRelevant(e.target.value)}
                      placeholder="Why does this matter to you?"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-orange-400 font-bold">Time-bound</Label>
                      <span className={`text-xs ${editTimeBound.length > 150 ? 'text-red-400' : 'text-white/60'}`}>
                        {editTimeBound.length}/150
                      </span>
                    </div>
                    <Input
                      value={editTimeBound}
                      onChange={(e) => setEditTimeBound(e.target.value)}
                      placeholder="Target date or timeframe"
                      className={`bg-white/10 border text-white ${
                        errors.timeBound ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {errors.timeBound && (
                      <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.timeBound}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <span className="text-green-400 font-bold text-sm">Specific:</span>
                      <p className="text-white/80 text-sm mt-1">{goal.specific}</p>
                    </div>
                    
                    <div>
                      <span className="text-blue-400 font-bold text-sm">Measurable:</span>
                      <p className="text-white/80 text-sm mt-1">{goal.measurable}</p>
                    </div>
                    
                    {goal.achievable && (
                      <div>
                        <span className="text-purple-400 font-bold text-sm">Achievable:</span>
                        <p className="text-white/80 text-sm mt-1">{goal.achievable}</p>
                      </div>
                    )}
                    
                    {goal.relevant && (
                      <div>
                        <span className="text-yellow-400 font-bold text-sm">Relevant:</span>
                        <p className="text-white/80 text-sm mt-1">{goal.relevant}</p>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-orange-400 font-bold text-sm">Time-bound:</span>
                      <p className="text-white/80 text-sm mt-1">{goal.timeBound}</p>
                    </div>
                  </div>

                  <motion.div 
                    className="grid grid-cols-2 gap-2 pt-2"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                      }
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate();
                        }}
                        aria-label="Duplicate goal"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm font-bold"
                      >
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        Duplicate
                      </button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive();
                        }}
                        aria-label={goal.status === 'paused' ? 'Reactivate goal' : 'Archive goal'}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm font-bold"
                      >
                        <Archive className="w-4 h-4" aria-hidden="true" />
                        {goal.status === 'paused' ? 'Reactivate' : 'Archive'}
                      </button>
                    </motion.div>
                    
                    <motion.div className="col-span-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        aria-label="Delete goal permanently"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        Delete Goal
                      </button>
                    </motion.div>
                  </motion.div>
                </>
              )}
              
              <div className="flex items-center gap-3 text-xs text-white/40 pt-3 border-t border-white/10">
                <Calendar className="w-3 h-3" />
                <span>Created {format(new Date(goal.created_date), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isEditing && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="sticky bottom-0 left-0 right-0 bg-[#1a1f35] border-t border-white/20 p-4 flex gap-3"
        >
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="w-full border border-white/20 text-white hover:bg-white/10 font-bold"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
              style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
