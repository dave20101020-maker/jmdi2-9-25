/**
 * Custom Backend API Client
 * Replaces Base44 SDK with custom backend endpoints
 */

const configuredBackendUrl = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).trim();
const normalizedBackendUrl = configuredBackendUrl
  ? configuredBackendUrl.replace(/\/$/, "")
  : "";
const runtimeOrigin =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin.replace(/\/$/, "")
    : "";

const API_BASE_URL = normalizedBackendUrl
  ? `${normalizedBackendUrl}/api`
  : runtimeOrigin
  ? `${runtimeOrigin}/api`
  : "";

if (!normalizedBackendUrl) {
  console.warn(
    "[apiClient] VITE_BACKEND_URL is not defined. Set it in src/.env.development so the frontend can reach the backend."
  );
}

class APIClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Include cookies for JWT stored in httpOnly cookie on the backend
        credentials: options.credentials || "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = error?.message || `API error: ${response.status}`;
        try {
          if (typeof window !== "undefined" && window.dispatchEvent) {
            window.dispatchEvent(
              new CustomEvent("api-error", { detail: message })
            );
          }
        } catch (e) {}
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async authMe() {
    return this.request("/auth/me", { method: "GET" });
  }

  async authLogin(email, password) {
    // backend expects `emailOrUsername`
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ emailOrUsername: email, password }),
    });
  }

  async authRegister(data) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async authUpdateMe(data) {
    return this.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // AI endpoints
  async aiCoach(prompt, context = {}, pillarFocus = "general") {
    return this.request("/ai/coach", {
      method: "POST",
      body: JSON.stringify({ prompt, userContext: context, pillarFocus }),
    });
  }

  async aiDailyPlan(prompt, goals = [], timeAvailable = 16) {
    return this.request("/ai/daily-plan", {
      method: "POST",
      body: JSON.stringify({ prompt, userGoals: goals, timeAvailable }),
    });
  }

  async aiPillarAnalysis(prompt, scores = {}, focusAreas = []) {
    return this.request("/ai/pillar-analysis", {
      method: "POST",
      body: JSON.stringify({ prompt, currentScores: scores, focusAreas }),
    });
  }

  async aiWeeklyReflection(prompt, weeklyData = {}, pillarScores = {}) {
    return this.request("/ai/weekly-reflection", {
      method: "POST",
      body: JSON.stringify({ prompt, weeklyData, pillarScores }),
    });
  }

  // Entry endpoints
  async createEntry(data) {
    return this.request("/entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getEntries(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/entries?${query}`, { method: "GET" });
  }

  async updateEntry(id, data) {
    return this.request(`/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteEntry(id) {
    return this.request(`/entries/${id}`, { method: "DELETE" });
  }

  // Habit endpoints
  async createHabit(data) {
    return this.request("/habits", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getHabits(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/habits?${query}`, { method: "GET" });
  }

  async updateHabit(id, data) {
    return this.request(`/habits/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteHabit(id) {
    return this.request(`/habits/${id}`, { method: "DELETE" });
  }

  // Goal endpoints
  async createGoal(data) {
    return this.request("/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getGoals(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/goals?${query}`, { method: "GET" });
  }

  async updateGoal(id, data) {
    return this.request(`/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id) {
    return this.request(`/goals/${id}`, { method: "DELETE" });
  }

  // Plan endpoints
  async createPlan(data) {
    return this.request("/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPlans(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/plans?${query}`, { method: "GET" });
  }

  async updatePlan(id, data) {
    return this.request(`/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePlan(id) {
    return this.request(`/plans/${id}`, { method: "DELETE" });
  }

  // Journal/Reflection endpoints
  async createJournal(data) {
    return this.request("/journal", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getJournals(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/journal?${query}`, { method: "GET" });
  }

  // Mood endpoints
  async createMood(data) {
    return this.request("/mood", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMoods(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/mood?${query}`, { method: "GET" });
  }

  // Meal endpoints
  async createMeal(data) {
    return this.request("/meals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMeals(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/meals?${query}`, { method: "GET" });
  }

  // Water intake endpoints
  async logWater(data) {
    return this.request("/water", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getWaterLogs(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/water?${query}`, { method: "GET" });
  }

  // Meditation endpoints
  async logMeditation(data) {
    return this.request("/meditation", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMeditationLogs(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/meditation?${query}`, { method: "GET" });
  }

  // Symptom/Health check endpoints
  async logSymptom(data) {
    return this.request("/symptoms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSymptoms(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/symptoms?${query}`, { method: "GET" });
  }

  async logHealthCheckIn(data) {
    return this.request("/health-checkin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getHealthCheckIns(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/health-checkin?${query}`, { method: "GET" });
  }

  // Medication endpoints
  async createMedication(data) {
    return this.request("/medications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMedications(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/medications?${query}`, { method: "GET" });
  }

  async updateMedication(id, data) {
    return this.request(`/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMedication(id) {
    return this.request(`/medications/${id}`, { method: "DELETE" });
  }

  // Subscription/Access endpoints
  async getSubscription(userId) {
    return this.request(`/subscriptions/${userId}`, { method: "GET" });
  }

  // Weekly review endpoints
  async createWeeklyReview(data) {
    return this.request("/weekly-review", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getWeeklyReviews(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/weekly-review?${query}`, { method: "GET" });
  }

  async deleteWeeklyReview(id) {
    return this.request(`/weekly-review/${id}`, { method: "DELETE" });
  }

  // Achievement endpoints
  async getAchievements(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/achievements?${query}`, { method: "GET" });
  }

  // Connection/Social endpoints
  async getConnections(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/connections?${query}`, { method: "GET" });
  }

  async createConnection(data) {
    return this.request("/connections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateConnection(id, data) {
    return this.request(`/connections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteConnection(id) {
    return this.request(`/connections/${id}`, { method: "DELETE" });
  }

  // Content endpoints
  async getPillarContent(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/content?${query}`, { method: "GET" });
  }

  async createPillarContent(data) {
    return this.request("/content", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Milestone endpoints
  async getMilestones(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/milestones?${query}`, { method: "GET" });
  }

  async createMilestone(data) {
    return this.request("/milestones", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMilestone(id, data) {
    return this.request(`/milestones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMilestone(id) {
    return this.request(`/milestones/${id}`, { method: "DELETE" });
  }

  // Daily Quest endpoints
  async getDailyQuests(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/daily-quests?${query}`, { method: "GET" });
  }

  async createDailyQuest(data) {
    return this.request("/daily-quests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Coach Interaction endpoints
  async getCoachInteractions(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/coach-interactions?${query}`, { method: "GET" });
  }

  async createCoachInteraction(data) {
    return this.request("/coach-interactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Exercise endpoints
  async getWorkoutLogs(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/workouts?${query}`, { method: "GET" });
  }

  async createWorkoutLog(data) {
    return this.request("/workouts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkoutLog(id, data) {
    return this.request(`/workouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getActiveMinutesGoals(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/active-minutes-goals?${query}`, { method: "GET" });
  }

  async createActiveMinutesGoal(data) {
    return this.request("/active-minutes-goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateActiveMinutesGoal(id, data) {
    return this.request(`/active-minutes-goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteActiveMinutesGoal(id) {
    return this.request(`/active-minutes-goals/${id}`, { method: "DELETE" });
  }

  async getPersonalBests(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/personal-bests?${query}`, { method: "GET" });
  }

  async createPersonalBest(data) {
    return this.request("/personal-bests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePersonalBest(id, data) {
    return this.request(`/personal-bests/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePersonalBest(id) {
    return this.request(`/personal-bests/${id}`, { method: "DELETE" });
  }

  // Finance endpoints
  async getBudgets(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/budgets?${query}`, { method: "GET" });
  }

  async createBudget(data) {
    return this.request("/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id, data) {
    return this.request(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id) {
    return this.request(`/budgets/${id}`, { method: "DELETE" });
  }

  async getExpenses(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/expenses?${query}`, { method: "GET" });
  }

  async createExpense(data) {
    return this.request("/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id, data) {
    return this.request(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, { method: "DELETE" });
  }

  async getSavingsGoals(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/savings-goals?${query}`, { method: "GET" });
  }

  async createSavingsGoal(data) {
    return this.request("/savings-goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSavingsGoal(id, data) {
    return this.request(`/savings-goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSavingsGoal(id) {
    return this.request(`/savings-goals/${id}`, { method: "DELETE" });
  }

  // Sleep endpoints
  async getBedtimeRoutines(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/bedtime-routines?${query}`, { method: "GET" });
  }

  async createBedtimeRoutine(data) {
    return this.request("/bedtime-routines", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBedtimeRoutine(id, data) {
    return this.request(`/bedtime-routines/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteBedtimeRoutine(id) {
    return this.request(`/bedtime-routines/${id}`, { method: "DELETE" });
  }

  async getSleepEnvironmentAudits(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/sleep-audits?${query}`, { method: "GET" });
  }

  async createSleepEnvironmentAudit(data) {
    return this.request("/sleep-audits", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSleepJournals(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/sleep-journals?${query}`, { method: "GET" });
  }

  async createSleepJournal(data) {
    return this.request("/sleep-journals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Social endpoints
  async getGroupChallenges(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/group-challenges?${query}`, { method: "GET" });
  }

  async createGroupChallenge(data) {
    return this.request("/group-challenges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateGroupChallenge(id, data) {
    return this.request(`/group-challenges/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getRelationshipCheckIns(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/relationship-check-ins?${query}`, { method: "GET" });
  }

  async createRelationshipCheckIn(data) {
    return this.request("/relationship-check-ins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRelationshipCheckIn(id, data) {
    return this.request(`/relationship-check-ins/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getSocialInteractions(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/social-interactions?${query}`, { method: "GET" });
  }

  async createSocialInteraction(data) {
    return this.request("/social-interactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Spirituality endpoints
  async getGratitudeEntries(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/gratitude-entries?${query}`, { method: "GET" });
  }

  async createGratitudeEntry(data) {
    return this.request("/gratitude-entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getReflectionEntries(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/reflection-entries?${query}`, { method: "GET" });
  }

  async createReflectionEntry(data) {
    return this.request("/reflection-entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getValuesExercises(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/values-exercises?${query}`, { method: "GET" });
  }

  async createValuesExercise(data) {
    return this.request("/values-exercises", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Upload endpoint (for files)
  async uploadFile(file) {
    // TODO: implement file upload
    console.warn("File upload not yet implemented");
    return null;
  }

  // Logout endpoint
  async logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  // Onboarding endpoints
  async getOnboardingProfile() {
    return this.request("/onboarding", { method: "GET" });
  }

  async saveOnboardingProfile(profile) {
    return this.request("/onboarding", {
      method: "POST",
      body: JSON.stringify(profile),
    });
  }

  // Subscription endpoints
  async getMySubscription() {
    return this.request("/subscription/me", { method: "GET" });
  }

  async upgradeSubscription(tier) {
    return this.request("/subscription/upgrade", {
      method: "POST",
      body: JSON.stringify({ tier }),
    });
  }

  // Pillar check-ins
  async createPillarCheckIn(data) {
    return this.request("/pillars/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPillarHistory(pillarId) {
    return this.request(`/pillars/${pillarId}/history`, { method: "GET" });
  }

  // Friends
  async sendFriendRequest(data) {
    return this.request("/friends/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async acceptFriendRequest(data) {
    return this.request("/friends/accept", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listFriends() {
    return this.request("/friends", { method: "GET" });
  }

  async listPendingFriendRequests() {
    return this.request("/friends/pending", { method: "GET" });
  }

  // Leaderboards
  async getLeaderboard(pillarId) {
    return this.request(`/friends/leaderboard/${pillarId}`, { method: "GET" });
  }

  async getOverallLeaderboard() {
    return this.request("/friends/leaderboard/overall", { method: "GET" });
  }

  async createChallenge(data) {
    return this.request("/challenges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async joinChallenge(challengeId) {
    return this.request("/challenges/join", {
      method: "POST",
      body: JSON.stringify({ challengeId }),
    });
  }

  async getMyChallenges() {
    return this.request("/challenges/my", { method: "GET" });
  }

  async sendMessage(data) {
    return this.request("/messages/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getConversation(friendId) {
    return this.request(`/messages/${friendId}`, { method: "GET" });
  }

  async getNotifications() {
    return this.request("/notifications", { method: "GET" });
  }

  async markNotificationsRead(body) {
    return this.request("/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getTimeline() {
    return this.request("/timeline", { method: "GET" });
  }

  async exportUserData() {
    return this.request("/user/export", { method: "GET" });
  }

  async deleteAccount() {
    return this.request("/user/delete-account", { method: "POST" });
  }

  async getWeeklyReport() {
    return this.request("/ai/weekly-report", { method: "GET" });
  }
}

// Export singleton instance
export const api = new APIClient();
export default api;
