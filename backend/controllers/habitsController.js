import Habit from "../models/Habit.js";
import { recordEvent } from "../utils/eventLogger.js";

// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res, next) => {
  try {
    const { userId, name, pillar } = req.body;

    // Validation
    if (!userId || !name || !pillar) {
      return res.status(400).json({
        success: false,
        error: "userId, name, and pillar are required",
      });
    }

    if (
      ![
        "sleep",
        "diet",
        "exercise",
        "physical_health",
        "mental_health",
        "finances",
        "social",
        "spirituality",
      ].includes(pillar)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid pillar value",
      });
    }

    const habit = new Habit({
      userId,
      name,
      pillar,
      isActive: true,
      streakCount: 0,
      bestStreak: 0,
      completionDates: [],
      totalCompletions: 0,
    });

    await habit.save();

    await recordEvent("habit_created", {
      userId,
      source: "api/habits",
      ip: req.ip,
      payload: { name, pillar },
    });

    res.status(201).json({
      success: true,
      data: habit,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all habits for a user
// @route   GET /api/habits?userId=xxx&pillar=xxx&isActive=true
// @access  Private
export const getHabits = async (req, res, next) => {
  try {
    const { userId, pillar, isActive } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const filter = { userId };
    if (pillar) filter.pillar = pillar;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const habits = await Habit.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get a single habit
// @route   GET /api/habits/:id
// @access  Private
export const getHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: "Habit not found",
      });
    }

    res.status(200).json({
      success: true,
      data: habit,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update a habit
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = async (req, res, next) => {
  try {
    const { name, pillar, isActive } = req.body;

    // Validate pillar if provided
    if (
      pillar &&
      ![
        "sleep",
        "diet",
        "exercise",
        "physical_health",
        "mental_health",
        "finances",
        "social",
        "spirituality",
      ].includes(pillar)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid pillar value",
      });
    }

    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      { name, pillar, isActive },
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: "Habit not found",
      });
    }

    res.status(200).json({
      success: true,
      data: habit,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Log habit completion
// @route   POST /api/habits/:id/complete
// @access  Private
export const completeHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: "Habit not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already completed today
    const alreadyCompleted = habit.completionDates.some((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (!alreadyCompleted) {
      habit.completionDates.push(today);
      habit.totalCompletions += 1;
      habit.streakCount += 1;
      if (habit.streakCount > habit.bestStreak) {
        habit.bestStreak = habit.streakCount;
      }
    }

    await habit.save();

    await recordEvent("habit_checkin_logged", {
      userId: habit.userId,
      source: "api/habits",
      ip: req.ip,
      payload: {
        pillar: habit.pillar,
        completedAt: today.toISOString(),
        alreadyCompleted,
        streakCount: habit.streakCount,
        bestStreak: habit.bestStreak,
      },
    });

    res.status(200).json({
      success: true,
      data: habit,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: "Habit not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
