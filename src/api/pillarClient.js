/**
 * Pillar Client
 * 
 * Centralized client for CRUD operations on pillar-related data.
 * Handles:
 * - Plans (create, read, update, delete)
 * - Goals (create, read, update, delete)
 * - Habits (create, read, update, delete)
 * - Check-ins (log daily check-ins)
 * - Screenings (assessments)
 * - Error handling with standardized responses
 */

import { PILLAR_ENDPOINTS, OTHER_ENDPOINTS, buildUrl, getAuthHeader, replacePathParams } from '@/config/apiConfig'
import { parseError, getUserFriendlyMessage } from '@/utils/errorHandling'

/**
 * Make authenticated fetch request to pillar endpoint
 * @param {string} endpoint - The endpoint (from PILLAR_ENDPOINTS or OTHER_ENDPOINTS)
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} [data] - Request body data (optional)
 * @param {object} [params] - Path parameters (optional)
 * @returns {Promise<object>} - Parsed response
 */
async function fetchPillar(endpoint, method = 'GET', data = null, params = {}) {
  try {
    const path = replacePathParams(endpoint, params)
    const url = buildUrl(path)

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      credentials: 'include',
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      const error = parseError(result || { message: 'Pillar request failed' })
      error.statusCode = response.status
      throw error
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Standard error response formatter
 */
function errorResponse(error, action = 'operation') {
  const parsedError = parseError(error)
  return {
    ok: false,
    error: true,
    message: getUserFriendlyMessage(parsedError),
    originalError: parsedError,
    statusCode: error.statusCode || 500,
  }
}

/**
 * PLANS - Lifecycle Plans
 */

/**
 * Create a new life plan
 */
export async function createPlan(planData) {
  try {
    const result = await fetchPillar(PILLAR_ENDPOINTS.PLANS, 'POST', {
      title: planData.title,
      description: planData.description || '',
      pillar: planData.pillar,
      content: planData.content,
      timeframe: planData.timeframe || '1 year',
      status: planData.status || 'active',
      tags: planData.tags || [],
    })

    return {
      ok: true,
      plan: result.plan || result,
      id: result.id || result._id,
    }
  } catch (error) {
    return errorResponse(error, 'create plan')
  }
}

/**
 * Get all plans for current user
 */
export async function getPlans(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString()
    const url = `${PILLAR_ENDPOINTS.PLANS}${query ? '?' + query : ''}`
    const result = await fetchPillar(url, 'GET')

    return {
      ok: true,
      plans: Array.isArray(result) ? result : result.plans || [],
    }
  } catch (error) {
    return errorResponse(error, 'fetch plans')
  }
}

/**
 * Get a specific plan by ID
 */
export async function getPlan(planId) {
  try {
    const result = await fetchPillar(
      PILLAR_ENDPOINTS.PLAN_BY_ID,
      'GET',
      null,
      { id: planId }
    )

    return {
      ok: true,
      plan: result.plan || result,
    }
  } catch (error) {
    return errorResponse(error, 'fetch plan')
  }
}

/**
 * Update an existing plan
 */
export async function updatePlan(planId, updates) {
  try {
    const result = await fetchPillar(
      PILLAR_ENDPOINTS.PLAN_BY_ID,
      'PUT',
      updates,
      { id: planId }
    )

    return {
      ok: true,
      plan: result.plan || result,
    }
  } catch (error) {
    return errorResponse(error, 'update plan')
  }
}

/**
 * Delete a plan
 */
export async function deletePlan(planId) {
  try {
    await fetchPillar(
      PILLAR_ENDPOINTS.PLAN_BY_ID,
      'DELETE',
      null,
      { id: planId }
    )

    return {
      ok: true,
      message: 'Plan deleted successfully',
    }
  } catch (error) {
    return errorResponse(error, 'delete plan')
  }
}

/**
 * GOALS - Life Goals
 */

/**
 * Create a new goal
 */
export async function createGoal(goalData) {
  try {
    const result = await fetchPillar(PILLAR_ENDPOINTS.GOALS, 'POST', {
      title: goalData.title,
      description: goalData.description || '',
      pillar: goalData.pillar,
      goalStatement: goalData.goalStatement,
      specific: goalData.specific,
      measurable: goalData.measurable,
      achievable: goalData.achievable,
      relevant: goalData.relevant,
      timeBound: goalData.timeBound,
      deadline: goalData.deadline,
      priority: goalData.priority || 'medium',
      status: goalData.status || 'active',
      linkedPlanId: goalData.linkedPlanId || null,
    })

    return {
      ok: true,
      goal: result.goal || result,
      id: result.id || result._id,
    }
  } catch (error) {
    return errorResponse(error, 'create goal')
  }
}

/**
 * Get all goals
 */
export async function getGoals(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString()
    const url = `${PILLAR_ENDPOINTS.GOALS}${query ? '?' + query : ''}`
    const result = await fetchPillar(url, 'GET')

    return {
      ok: true,
      goals: Array.isArray(result) ? result : result.goals || [],
    }
  } catch (error) {
    return errorResponse(error, 'fetch goals')
  }
}

/**
 * Get a specific goal by ID
 */
export async function getGoal(goalId) {
  try {
    const result = await fetchPillar(
      PILLAR_ENDPOINTS.GOAL_BY_ID,
      'GET',
      null,
      { id: goalId }
    )

    return {
      ok: true,
      goal: result.goal || result,
    }
  } catch (error) {
    return errorResponse(error, 'fetch goal')
  }
}

/**
 * Update a goal
 */
export async function updateGoal(goalId, updates) {
  try {
    const result = await fetchPillar(
      PILLAR_ENDPOINTS.GOAL_BY_ID,
      'PUT',
      updates,
      { id: goalId }
    )

    return {
      ok: true,
      goal: result.goal || result,
    }
  } catch (error) {
    return errorResponse(error, 'update goal')
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId) {
  try {
    await fetchPillar(
      PILLAR_ENDPOINTS.GOAL_BY_ID,
      'DELETE',
      null,
      { id: goalId }
    )

    return {
      ok: true,
      message: 'Goal deleted successfully',
    }
  } catch (error) {
    return errorResponse(error, 'delete goal')
  }
}

/**
 * HABITS - Daily/Weekly Habits
 */

/**
 * Create a new habit
 */
export async function createHabit(habitData) {
  try {
    const result = await fetchPillar(PILLAR_ENDPOINTS.HABITS, 'POST', {
      title: habitData.title,
      description: habitData.description || '',
      pillar: habitData.pillar,
      frequency: habitData.frequency || 'daily', // daily, weekly, monthly
      targetCount: habitData.targetCount || 1,
      timeOfDay: habitData.timeOfDay || null,
      reminder: habitData.reminder !== false,
      status: habitData.status || 'active',
      linkedGoalId: habitData.linkedGoalId || null,
    })

    return {
      ok: true,
      habit: result.habit || result,
      id: result.id || result._id,
    }
  } catch (error) {
    return errorResponse(error, 'create habit')
  }
}

/**
 * Get all habits
 */
export async function getHabits(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString()
    const url = `${PILLAR_ENDPOINTS.HABITS}${query ? '?' + query : ''}`
    const result = await fetchPillar(url, 'GET')

    return {
      ok: true,
      habits: Array.isArray(result) ? result : result.habits || [],
    }
  } catch (error) {
    return errorResponse(error, 'fetch habits')
  }
}

/**
 * Get a specific habit by ID
 */
export async function getHabit(habitId) {
  try {
    const result = await fetchPillar(
      PILLAR_ENDPOINTS.HABIT_BY_ID,
      'GET',
      null,
      { id: habitId }
    )

    return {
      ok: true,
      habit: result.habit || result,
    }
  } catch (error) {
    return errorResponse(error, 'fetch habit')
  }
}

/**
 * Update a habit
 */
export async function updateHabit(habitId, updates) {
  try {
    const result = await fetchPillar(
      PILLAR_ENDPOINTS.HABIT_BY_ID,
      'PUT',
      updates,
      { id: habitId }
    )

    return {
      ok: true,
      habit: result.habit || result,
    }
  } catch (error) {
    return errorResponse(error, 'update habit')
  }
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId) {
  try {
    await fetchPillar(
      PILLAR_ENDPOINTS.HABIT_BY_ID,
      'DELETE',
      null,
      { id: habitId }
    )

    return {
      ok: true,
      message: 'Habit deleted successfully',
    }
  } catch (error) {
    return errorResponse(error, 'delete habit')
  }
}

/**
 * LOG HABIT COMPLETION
 */
export async function logHabitCompletion(habitId, date) {
  try {
    const result = await fetchPillar(
      `${PILLAR_ENDPOINTS.HABIT_BY_ID}/log`,
      'POST',
      { date: date || new Date().toISOString().split('T')[0] },
      { id: habitId }
    )

    return {
      ok: true,
      log: result,
    }
  } catch (error) {
    return errorResponse(error, 'log habit')
  }
}

/**
 * CHECK-INS - Daily/Weekly Check-ins
 */

/**
 * Create a pillar check-in (daily score, notes, etc.)
 */
export async function createCheckIn(checkInData) {
  try {
    const result = await fetchPillar(OTHER_ENDPOINTS.CHECKINS, 'POST', {
      pillar: checkInData.pillar,
      score: checkInData.score || 5, // 1-10 scale
      notes: checkInData.notes || '',
      mood: checkInData.mood || 'neutral',
      date: checkInData.date || new Date().toISOString(),
      metrics: checkInData.metrics || {},
    })

    return {
      ok: true,
      checkIn: result.checkIn || result,
      id: result.id || result._id,
    }
  } catch (error) {
    return errorResponse(error, 'create check-in')
  }
}

/**
 * Get check-ins for a pillar
 */
export async function getCheckIns(pillar, filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString()
    const url = `${replacePathParams(OTHER_ENDPOINTS.CHECKIN_BY_PILLAR, { pillar })}${query ? '?' + query : ''}`
    const result = await fetchPillar(url, 'GET')

    return {
      ok: true,
      checkIns: Array.isArray(result) ? result : result.checkIns || [],
    }
  } catch (error) {
    return errorResponse(error, 'fetch check-ins')
  }
}

/**
 * SCREENINGS - Assessments
 */

/**
 * Create a screening/assessment result
 */
export async function createScreening(screeningData) {
  try {
    const result = await fetchPillar(OTHER_ENDPOINTS.SCREENINGS, 'POST', {
      type: screeningData.type, // e.g., 'PHQ-9', 'PSQI'
      pillar: screeningData.pillar,
      score: screeningData.score,
      results: screeningData.results || {},
      timestamp: screeningData.timestamp || new Date().toISOString(),
    })

    return {
      ok: true,
      screening: result.screening || result,
      id: result.id || result._id,
    }
  } catch (error) {
    return errorResponse(error, 'create screening')
  }
}

/**
 * Get screenings
 */
export async function getScreenings(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString()
    const url = `${OTHER_ENDPOINTS.SCREENINGS}${query ? '?' + query : ''}`
    const result = await fetchPillar(url, 'GET')

    return {
      ok: true,
      screenings: Array.isArray(result) ? result : result.screenings || [],
    }
  } catch (error) {
    return errorResponse(error, 'fetch screenings')
  }
}

/**
 * ENTRIES - Journal entries and logs
 */

/**
 * Create an entry (journal, reflection, note)
 */
export async function createEntry(entryData) {
  try {
    const result = await fetchPillar(OTHER_ENDPOINTS.ENTRIES, 'POST', {
      title: entryData.title || '',
      content: entryData.content,
      pillar: entryData.pillar,
      type: entryData.type || 'journal', // journal, reflection, note
      date: entryData.date || new Date().toISOString(),
      mood: entryData.mood,
      tags: entryData.tags || [],
    })

    return {
      ok: true,
      entry: result.entry || result,
      id: result.id || result._id,
    }
  } catch (error) {
    return errorResponse(error, 'create entry')
  }
}

/**
 * Get entries with optional filters
 */
export async function getEntries(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString()
    const url = `${OTHER_ENDPOINTS.ENTRIES}${query ? '?' + query : ''}`
    const result = await fetchPillar(url, 'GET')

    return {
      ok: true,
      entries: Array.isArray(result) ? result : result.entries || [],
    }
  } catch (error) {
    return errorResponse(error, 'fetch entries')
  }
}

/**
 * Update an entry
 */
export async function updateEntry(entryId, updates) {
  try {
    const result = await fetchPillar(
      OTHER_ENDPOINTS.ENTRY_BY_ID,
      'PUT',
      updates,
      { id: entryId }
    )

    return {
      ok: true,
      entry: result.entry || result,
    }
  } catch (error) {
    return errorResponse(error, 'update entry')
  }
}

/**
 * Delete an entry
 */
export async function deleteEntry(entryId) {
  try {
    await fetchPillar(
      OTHER_ENDPOINTS.ENTRY_BY_ID,
      'DELETE',
      null,
      { id: entryId }
    )

    return {
      ok: true,
      message: 'Entry deleted successfully',
    }
  } catch (error) {
    return errorResponse(error, 'delete entry')
  }
}

export default {
  // Plans
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  deletePlan,

  // Goals
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,

  // Habits
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  deleteHabit,
  logHabitCompletion,

  // Check-ins
  createCheckIn,
  getCheckIns,

  // Screenings
  createScreening,
  getScreenings,

  // Entries
  createEntry,
  getEntries,
  updateEntry,
  deleteEntry,
}
