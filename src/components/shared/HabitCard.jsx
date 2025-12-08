import { api } from "@/utils/apiClient";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  Flame,
  Calendar,
  TrendingUp,
  Pause,
  Play,
  Edit2,
  Trash2,
  Copy,
  Archive,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  AlertCircle,
  Link,
  Check,
  Shield,
  Bell,
  BellOff,
  Clock,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { PILLARS } from "@/utils";

export default function HabitCard({
  habit,
  onToggleComplete,
  onEdit,
  onDelete,
  onTogglePause,
  compact = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [editText, setEditText] = useState(habit.habitText || "");
  const [editFrequency, setEditFrequency] = useState(
    habit.frequency || "daily"
  );
  const [editReminderTime, setEditReminderTime] = useState(
    habit.reminderTime || "09:00"
  );
  const [editDifficulty, setEditDifficulty] = useState(
    habit.difficulty || "medium"
  );
  const [editReminderEnabled, setEditReminderEnabled] = useState(
    habit.reminderEnabled ?? true
  );

  // Validation
  const [errors, setErrors] = useState({});

  const pillar = PILLARS[habit.pillar];

  const today = format(new Date(), "yyyy-MM-dd");
  const isCompletedToday = habit.completionDates?.includes(today) || false;

  const lastCompletedDate = habit.lastCompletedDate
    ? new Date(habit.lastCompletedDate)
    : null;
  const daysSinceLastCompletion = lastCompletedDate
    ? differenceInDays(new Date(), lastCompletedDate)
    : 999;
  const isStreakAtRisk = daysSinceLastCompletion > 1 && habit.streakCount > 0;

  const completionRate =
    habit.totalCompletions > 0 && habit.created_date
      ? Math.round(
          (habit.totalCompletions /
            Math.max(
              1,
              differenceInDays(new Date(), new Date(habit.created_date))
            )) *
            100
        )
      : 0;

  const hasLinks = !!(habit.linkedPlanId || habit.linkedGoalId);
  const forgivenessUsed = habit.forgivenessUsedThisWeek || false;

  const handleExpand = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsExpanded(true);
    setEditText(habit.habitText || "");
    setEditFrequency(habit.frequency || "daily");
    setEditReminderTime(habit.reminderTime || "09:00");
    setEditDifficulty(habit.difficulty || "medium");
    setEditReminderEnabled(habit.reminderEnabled ?? true);
    setErrors({});
  };

  const validateFields = () => {
    const newErrors = {};

    if (!editText.trim()) newErrors.habitText = "Habit text is required";
    if (editText.length > 200) newErrors.habitText = "Max 200 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      toast.error("Please fix validation errors");
      return;
    }

    setIsSaving(true);

    try {
      await api.updateHabit(habit.id, {
        habitText: editText,
        frequency: editFrequency,
        reminderTime: editReminderTime,
        difficulty: editDifficulty,
        reminderEnabled: editReminderEnabled,
      });

      setIsEditing(false);
      toast.success("Habit updated! ⚡");
      onEdit?.();
    } catch (error) {
      console.error("Error updating habit:", error);
      toast.error("Failed to update habit");
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  const handleDuplicate = async () => {
    try {
      await api.createHabit({
        userId: habit.userId,
        habitText: `${habit.habitText} (Copy)`,
        pillar: habit.pillar,
        linkedPlanId: habit.linkedPlanId,
        linkedGoalId: habit.linkedGoalId,
        frequency: habit.frequency,
        reminderTime: habit.reminderTime,
        reminderEnabled: habit.reminderEnabled,
        difficulty: habit.difficulty,
        category: habit.category,
        isActive: true,
        streakCount: 0,
        bestStreak: 0,
        totalCompletions: 0,
      });

      toast.success("Habit duplicated! 📋");
      onEdit?.();
    } catch (error) {
      console.error("Error duplicating habit:", error);
      toast.error("Failed to duplicate habit");
    }
  };

  const handleArchive = () => {
    onTogglePause?.();
    toast.success(habit.isActive ? "Habit paused 📦" : "Habit reactivated! ✨");
  };

  if (compact) {
    return (
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
        onClick={handleExpand}
        style={{ boxShadow: `0 0 15px ${pillar.color}30` }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        layout
      >
        <div className="flex items-center gap-3">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            disabled={!habit.isActive}
            className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
              isCompletedToday
                ? "bg-green-500/20 border-green-500"
                : "border-white/30 hover:border-white/60"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCompletedToday ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <Circle className="w-6 h-6 text-white/40" />
            )}
          </motion.button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-white font-semibold truncate flex-1">
                {habit.habitText}
              </h4>
              {hasLinks && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Link className="w-3 h-3 text-[#D4AF37]" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                {habit.streakCount} day{habit.streakCount !== 1 ? "s" : ""}
                {forgivenessUsed && (
                  <Shield
                    className="w-3 h-3 text-blue-400"
                    title="Forgiveness used this week"
                  />
                )}
              </span>
              {habit.frequency !== "daily" && (
                <>
                  <span>•</span>
                  <span>{habit.frequency}</span>
                </>
              )}
              {habit.reminderEnabled && (
                <>
                  <span>•</span>
                  <Bell className="w-3 h-3 text-blue-400" />
                  <span>{habit.reminderTime}</span>
                </>
              )}
            </div>
          </div>

          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
            style={{
              backgroundColor: `${pillar.color}20`,
              boxShadow: `0 0 10px ${pillar.color}40`,
            }}
          >
            {pillar.icon}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`bg-white/5 border rounded-2xl overflow-hidden transition-all ${
        !habit.isActive ? "opacity-60" : ""
      } ${hasLinks ? "ring-2 ring-[#D4AF37]/30" : ""}`}
      style={{
        borderColor: isStreakAtRisk ? "#EF4444" : "rgba(255, 255, 255, 0.1)",
        boxShadow: `0 0 20px ${pillar.color}30`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300 }}
      layout
    >
      {/* Card Header - Clickable */}
      <motion.button
        onClick={handleExpand}
        className="w-full text-left p-5 hover:bg-white/5 transition-all"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
              disabled={!habit.isActive}
              aria-label={
                isCompletedToday
                  ? "Mark habit as incomplete"
                  : "Mark habit as complete"
              }
              className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                isCompletedToday
                  ? "bg-green-500/20 border-green-500 scale-110"
                  : "border-white/30 hover:border-white/60 hover:scale-105"
              } ${!habit.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
              whileHover={{ scale: isCompletedToday ? 1.15 : 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isCompletedToday ? (
                  <motion.div
                    key="completed"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle2
                      className="w-7 h-7 text-green-400"
                      aria-hidden="true"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="incomplete"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Circle
                      className="w-7 h-7 text-white/40"
                      aria-hidden="true"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white flex-1">
                  {habit.habitText}
                </h3>
                {hasLinks && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full">
                    <Link className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-xs text-[#D4AF37] font-bold">
                      Linked
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${pillar.color}30` }}
                >
                  {pillar.icon}
                </div>
                <span>{pillar.name}</span>
                {habit.frequency !== "daily" && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{habit.frequency}</span>
                  </>
                )}
                {habit.reminderEnabled && (
                  <>
                    <span>•</span>
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span>{habit.reminderTime}</span>
                  </>
                )}
              </div>

              {!habit.isActive && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs text-white/60">
                  <Pause className="w-3 h-3" />
                  Paused
                </div>
              )}
            </div>
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
            {!isEditing ? (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                aria-label="Edit habit"
                className="text-white/60 hover:text-[#D4AF37] transition-colors"
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  aria-label="Cancel editing"
                  className="text-white/60 hover:text-white transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  aria-label="Save changes"
                  className="text-green-400 hover:text-green-300 transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Check className="w-5 h-5" aria-hidden="true" />
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Stats - WITH FORGIVENESS BADGE */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {[
            {
              icon: Flame,
              label: "Streak",
              value: habit.streakCount,
              color: "orange",
              sub: forgivenessUsed
                ? "Protected"
                : `Best: ${habit.bestStreak || habit.streakCount}`,
              hasShield: forgivenessUsed,
            },
            {
              icon: CheckCircle2,
              label: "Total",
              value: habit.totalCompletions || 0,
              color: "green",
              sub: "completions",
            },
            {
              icon: TrendingUp,
              label: "Rate",
              value: `${completionRate}%`,
              color: "blue",
              sub: "success",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-3 text-center relative"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.05, y: -3 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {stat.hasShield && (
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center"
                  title="1 forgiveness used this week"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Shield className="w-3 h-3 text-blue-400" />
                </motion.div>
              )}
              <div className="flex items-center justify-center gap-1 mb-1">
                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                <span className="text-white/70 text-xs">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold text-${stat.color}-400`}>
                {stat.value}
              </div>
              <div className="text-xs text-white/60">{stat.sub}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-t border-white/10"
          >
            <div className="p-5 space-y-4">
              {isEditing ? (
                <>
                  {/* Editable Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white font-bold">
                        Habit Description
                      </Label>
                      <span
                        className={`text-xs ${
                          editText.length > 200
                            ? "text-red-400"
                            : "text-white/60"
                        }`}
                      >
                        {editText.length}/200
                      </span>
                    </div>
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="What habit do you want to build?"
                      className={`bg-white/10 border text-white ${
                        errors.habitText ? "border-red-500" : "border-white/20"
                      }`}
                    />
                    {errors.habitText && (
                      <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.habitText}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-white mb-2 block font-bold">
                      Frequency
                    </Label>
                    <Select
                      value={editFrequency}
                      onValueChange={setEditFrequency}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="workdays">Workdays</SelectItem>
                        <SelectItem value="weekends">Weekends</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block font-bold">
                      Difficulty
                    </Label>
                    <Select
                      value={editDifficulty}
                      onValueChange={setEditDifficulty}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reminder Settings */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-400" />
                        <Label className="text-white font-bold">
                          Daily Reminder
                        </Label>
                      </div>
                      <button
                        onClick={() =>
                          setEditReminderEnabled(!editReminderEnabled)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editReminderEnabled ? "bg-blue-500" : "bg-white/20"
                        }`}
                        aria-label={
                          editReminderEnabled
                            ? "Disable reminder"
                            : "Enable reminder"
                        }
                      >
                        <motion.span
                          className="inline-block h-4 w-4 transform rounded-full bg-white"
                          animate={{ x: editReminderEnabled ? 24 : 4 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {editReminderEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Label className="text-white/90 mb-2 block text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Reminder Time
                          </Label>
                          <Input
                            type="time"
                            value={editReminderTime}
                            onChange={(e) =>
                              setEditReminderTime(e.target.value)
                            }
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <p className="text-xs text-white/60 mt-2">
                            You'll get a notification at {editReminderTime} to
                            complete this habit
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!editReminderEnabled && (
                      <p className="text-xs text-white/60">
                        Enable reminders to get daily notifications
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Read-only Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Frequency:</span>
                      <span className="text-white font-medium capitalize">
                        {habit.frequency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Difficulty:</span>
                      <span
                        className={`font-medium capitalize ${
                          habit.difficulty === "easy"
                            ? "text-green-400"
                            : habit.difficulty === "hard"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {habit.difficulty || "medium"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70 flex items-center gap-1">
                        {habit.reminderEnabled ? (
                          <Bell className="w-4 h-4 text-blue-400" />
                        ) : (
                          <BellOff className="w-4 h-4 text-white/40" />
                        )}
                        Reminder:
                      </span>
                      <span
                        className={`font-medium ${
                          habit.reminderEnabled
                            ? "text-blue-400"
                            : "text-white/60"
                        }`}
                      >
                        {habit.reminderEnabled ? habit.reminderTime : "Off"}
                      </span>
                    </div>

                    {habit.lastCompletedDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">Last completed:</span>
                        <span className="text-white font-medium">
                          {format(
                            new Date(habit.lastCompletedDate),
                            "MMM d, yyyy"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {forgivenessUsed && (
                      <motion.div
                        className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
                          <Shield className="w-4 h-4" />1 forgiveness used this
                          week - streak protected!
                        </div>
                      </motion.div>
                    )}

                    {isStreakAtRisk && (
                      <motion.div
                        className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring" }}
                      >
                        <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                          <AlertCircle className="w-4 h-4 animate-pulse" />
                          Streak at risk! Complete today to maintain it.
                        </div>
                      </motion.div>
                    )}

                    {isCompletedToday && (
                      <motion.div
                        className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring" }}
                      >
                        <span className="text-green-400 text-sm font-semibold">
                          ✓ Completed today!
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions Row */}
                  <motion.div
                    className="flex gap-2 pt-2"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate();
                      }}
                      aria-label="Duplicate habit"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm font-bold"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      Duplicate
                    </motion.button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive();
                      }}
                      aria-label={
                        habit.isActive ? "Pause habit" : "Resume habit"
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm font-bold"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      {habit.isActive ? (
                        <>
                          <Pause className="w-4 h-4" aria-hidden="true" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" aria-hidden="true" />
                          Resume
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this habit?")) onDelete();
                      }}
                      aria-label="Delete habit"
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </motion.button>
                  </motion.div>
                </>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-white/40 pt-3 border-t border-white/10">
                <Calendar className="w-3 h-3" />
                <span>
                  Created {format(new Date(habit.created_date), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Bar (Edit Mode) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="sticky bottom-0 left-0 right-0 bg-[#1a1f35] border-t border-white/20 p-4 flex gap-3"
          >
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleCancel}
                variant="ghost"
                className="w-full border border-white/20 text-white hover:bg-white/10 font-bold"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </motion.div>
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold"
                style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
