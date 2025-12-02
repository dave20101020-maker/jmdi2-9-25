const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function request(path, opts = {}){
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    credentials: 'include', // send cookies
    headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) },
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text().catch(()=>null)
    let err = text || res.statusText
    try { err = JSON.parse(text) } catch (e) {}
    // normalize message
    const message = (err && err.message) ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('api-error', { detail: message }));
      }
    } catch (e) { /* no-op */ }
    throw err
  }
  return res.json().catch(()=>null)
}

export const api = {
  // Auth
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/me', { method: 'GET' }),

  // Pillars
  getPillars: (q='') => request(`/api/pillars${q?`?${q}`:''}`),
  upsertPillar: (data) => request('/api/pillars', { method: 'POST', body: JSON.stringify(data) }),

  // Entries
  getEntries: (q='') => request(`/api/entries${q?`?${q}`:''}`),
  createEntry: (data) => request('/api/entries', { method: 'POST', body: JSON.stringify(data) }),

  // AI
  ai: (path, data) => request(`/api/ai/${path}`, { method: 'POST', body: JSON.stringify(data) }),
  // Onboarding
  getOnboardingProfile: () => request('/api/onboarding', { method: 'GET' }),
  saveOnboardingProfile: (data) => request('/api/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  // Subscription
  getMySubscription: () => request('/api/subscription/me', { method: 'GET' }),
  upgradeSubscription: (tier) => request('/api/subscription/upgrade', { method: 'POST', body: JSON.stringify({ tier }) }),
  // Action Plans
  createActionPlan: (data) => request('/api/action-plans', { method: 'POST', body: JSON.stringify(data) }),
  getLatestActionPlan: (pillarId) => request(`/api/action-plans/${pillarId}`, { method: 'GET' }),
  // Pillar check-ins
  createPillarCheckIn: (data) => request('/api/pillars/check-in', { method: 'POST', body: JSON.stringify(data) }),
  getPillarHistory: (pillarId) => request(`/api/pillars/${pillarId}/history`, { method: 'GET' }),
  // Friends
  sendFriendRequest: (data) => request('/api/friends/request', { method: 'POST', body: JSON.stringify(data) }),
  acceptFriendRequest: (data) => request('/api/friends/accept', { method: 'POST', body: JSON.stringify(data) }),
  listFriends: () => request('/api/friends', { method: 'GET' }),
  listPendingFriendRequests: () => request('/api/friends/pending', { method: 'GET' }),
  // Leaderboards
  getLeaderboard: (pillarId) => request(`/api/friends/leaderboard/${pillarId}`, { method: 'GET' }),
  getOverallLeaderboard: () => request('/api/friends/leaderboard/overall', { method: 'GET' }),
  // Weekly report
  getWeeklyReport: () => request('/api/ai/weekly-report', { method: 'GET' }),
  // Challenges
  createChallenge: (data) => request('/api/challenges', { method: 'POST', body: JSON.stringify(data) }),
  joinChallenge: (challengeId) => request('/api/challenges/join', { method: 'POST', body: JSON.stringify({ challengeId }) }),
  getMyChallenges: () => request('/api/challenges/my', { method: 'GET' }),
  // Messaging
  sendMessage: (data) => request('/api/messages/send', { method: 'POST', body: JSON.stringify(data) }),
  getConversation: (friendId) => request(`/api/messages/${friendId}`, { method: 'GET' }),
  // Notifications
  getNotifications: () => request('/api/notifications', { method: 'GET' }),
  markNotificationsRead: (body) => request('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify(body) }),
  // Timeline
  getTimeline: () => request('/api/timeline', { method: 'GET' }),
  // GDPR: export & delete
  exportUserData: () => request('/api/user/export', { method: 'GET' }),
  deleteAccount: () => request('/api/user/delete-account', { method: 'POST' }),
}

export default api
