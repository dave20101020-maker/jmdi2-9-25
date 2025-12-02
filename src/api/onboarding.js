import { post, get } from './client';

/**
 * Save onboarding data and answers to the backend
 * @param {string} userId - User ID
 * @param {Object} data - Onboarding data containing pillar responses
 * @param {Object} data.responses - Key-value pairs of question IDs and answers
 * @param {Object} data.scores - Calculated scores for each pillar
 * @param {Object} data.metadata - Additional metadata (timestamp, version, etc.)
 * @returns {Promise<Object>} Response from the server
 */
export const saveOnboardingData = async (userId, data) => {
  try {
    const response = await post('/api/onboarding', {
      userId,
      ...data,
      completedAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    throw error;
  }
};

/**
 * Get onboarding profile for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Onboarding profile data
 */
export const getOnboardingProfile = async (userId) => {
  try {
    const response = await get(`/api/onboarding/${userId}`);
    return response;
  } catch (error) {
    console.error('Error fetching onboarding profile:', error);
    throw error;
  }
};

/**
 * Update onboarding answers (for re-assessment)
 * @param {string} userId - User ID
 * @param {Object} updates - Updated responses or scores
 * @returns {Promise<Object>} Updated profile
 */
export const updateOnboardingData = async (userId, updates) => {
  try {
    const response = await post(`/api/onboarding/${userId}`, updates);
    return response;
  } catch (error) {
    console.error('Error updating onboarding data:', error);
    throw error;
  }
};

/**
 * Check if user has completed onboarding
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if onboarding is complete
 */
export const checkOnboardingStatus = async (userId) => {
  try {
    const response = await get(`/api/onboarding/${userId}/status`);
    return response.completed || false;
  } catch (error) {
    // If not found, assume not completed
    return false;
  }
};

export default {
  saveOnboardingData,
  getOnboardingProfile,
  updateOnboardingData,
  checkOnboardingStatus,
};
