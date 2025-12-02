import Habit from '../models/Habit.js'

// @desc    Get all habits for a user
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res) => {
  try {
    const userId = req.user._id
    const habits = await Habit.find({ userId }).sort({ createdAt: -1 })
    
    res.json({
      success: true,
      count: habits.length,
      data: habits,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Get single habit
// @route   GET /api/habits/:id
// @access  Private
export const getHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id)

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      })
    }

    // Check if habit belongs to user
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this habit',
      })
    }

    res.json({
      success: true,
      data: habit,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Create new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res) => {
  try {
    const habitData = {
      ...req.body,
      userId: req.user._id,
    }

    const habit = await Habit.create(habitData)
    
    res.status(201).json({
      success: true,
      data: habit,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Update habit
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = async (req, res) => {
  try {
    let habit = await Habit.findById(req.params.id)

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      })
    }

    // Check if habit belongs to user
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this habit',
      })
    }

    habit = await Habit.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )

    res.json({
      success: true,
      data: habit,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Delete habit
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id)

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      })
    }

    // Check if habit belongs to user
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this habit',
      })
    }

    await habit.deleteOne()

    res.json({
      success: true,
      data: {},
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export default {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
}
