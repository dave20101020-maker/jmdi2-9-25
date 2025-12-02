import Pillar from '../models/Pillar.js'

// @desc    Get all pillars
// @route   GET /api/pillars
// @access  Public
export const getPillars = async (req, res) => {
  try {
    const pillars = await Pillar.find({ isActive: true }).sort({ order: 1 })
    res.json({
      success: true,
      count: pillars.length,
      data: pillars,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Get single pillar by ID or identifier
// @route   GET /api/pillars/:id
// @access  Public
export const getPillar = async (req, res) => {
  try {
    const pillar = await Pillar.findOne({
      $or: [{ _id: req.params.id }, { identifier: req.params.id }],
    })

    if (!pillar) {
      return res.status(404).json({
        success: false,
        error: 'Pillar not found',
      })
    }

    res.json({
      success: true,
      data: pillar,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Create new pillar
// @route   POST /api/pillars
// @access  Private/Admin
export const createPillar = async (req, res) => {
  try {
    const pillar = await Pillar.create(req.body)
    res.status(201).json({
      success: true,
      data: pillar,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Update pillar
// @route   PUT /api/pillars/:id
// @access  Private/Admin
export const updatePillar = async (req, res) => {
  try {
    const pillar = await Pillar.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!pillar) {
      return res.status(404).json({
        success: false,
        error: 'Pillar not found',
      })
    }

    res.json({
      success: true,
      data: pillar,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Delete pillar
// @route   DELETE /api/pillars/:id
// @access  Private/Admin
export const deletePillar = async (req, res) => {
  try {
    const pillar = await Pillar.findByIdAndDelete(req.params.id)

    if (!pillar) {
      return res.status(404).json({
        success: false,
        error: 'Pillar not found',
      })
    }

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
  getPillars,
  getPillar,
  createPillar,
  updatePillar,
  deletePillar,
}
