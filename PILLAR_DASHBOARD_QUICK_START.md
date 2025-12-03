# 8-Pillar Dashboard - Quick Start Guide

## 🎯 Available Pillar Dashboards

All 8 pillar dashboards are now live and accessible:

| Pillar | Route | Status |
|--------|-------|--------|
| 🌙 Sleep | `/pillar/sleep` | ✅ Live |
| 🥗 Diet | `/pillar/diet` | ✅ Live |
| 💪 Exercise | `/pillar/exercise` | ✅ Live |
| ❤️ Physical Health | `/pillar/physical-health` | ✅ Live |
| 🧠 Mental Health | `/pillar/mental-health` | ✅ Live |
| 💰 Finances | `/pillar/finances` | ✅ Live |
| 👥 Social | `/pillar/social` | ✅ Live |
| ✨ Spirituality | `/pillar/spirituality` | ✅ Live |

## 🚀 What Each Dashboard Shows

### Current State
- **Active Goals** - Up to 3 goals you're working on
- **Active Habits** - Up to 3 habits you're tracking
- **Last Check-in** - Your most recent status check with emoji rating
- **AI Coach Chat** - Send messages to your pillar coach
- **Pillar Score** - Your progress score (0-100) with visual indicator

### Example: Sleep Dashboard
```
/pillar/sleep

┌─────────────────────────────────────┐
│  🌙 Sleep Hub                       │
│  Quality sleep is foundational...   │
├─────────────────────────────────────┤
│ Stats: 3 Goals | 4 Habits | 72/100  │
├─────────────────────────────────────┤
│ Sleep Goals                         │
│ ✓ Get 8 hours nightly              │
│ ✓ Improve sleep quality             │
│ ✓ Reduce midnight awakenings        │
├─────────────────────────────────────┤
│ Sleep Habits                        │
│ ✓ Bedtime routine (🔥 5 day streak)│
│ ✓ No screens 1 hour before bed      │
│ ✓ Cool room environment (🔥 3 days)│
├─────────────────────────────────────┤
│ Last Check-in                       │
│ 😊 (Today) "Slept well!"            │
├─────────────────────────────────────┤
│ Ask the Sleep Coach                 │
│ [Message textarea]                  │
│ [Send Message button]               │
├─────────────────────────────────────┤
│ Pillar Score: 72/100               │
│ 👍 Good progress, room to grow      │
└─────────────────────────────────────┘
```

## 🔌 How It Works

### Data Flow
1. **Load User** → Fetch current user from `/api/auth/me`
2. **Fetch Goals** → Query `/api/goals?pillar=sleep&status=active`
3. **Fetch Habits** → Query `/api/habits?pillar=sleep&status=active`
4. **Fetch Check-ins** → Query `/api/check-ins?pillar=sleep`
5. **Display Data** → Render with pillar colors and formatting

### AI Coach Integration
```
User Message: "How can I improve my sleep quality?"
           ↓
POST /api/ai/orchestrator
{
  pillar: "sleep",
  message: "How can I improve my sleep quality?",
  agent: "sleep_coach"
}
           ↓
Coach Response: [Sent to chat/saved in history]
```

### Check-in Submission
```
User Click: "Check In Now" or rates 1-5 emojis
           ↓
POST /api/check-ins
{
  pillar: "sleep",
  rating: 4,
  notes: "Slept well!",
  date: "2025-12-03T..."
}
           ↓
Update Last Check-in Display
Show: "😊 (Today) Slept well!"
```

## 📱 Using Pillar Dashboards

### Navigate to a Pillar
```
Option 1: Direct URL
  http://localhost:5173/pillar/sleep

Option 2: From Dashboard (future)
  Click pillar card → Navigate to dashboard

Option 3: From Sidebar (future)
  Click "Sleep Hub" → Navigate to /pillar/sleep
```

### View Your Data
```
1. Wait for dashboard to load
2. See your 3 most recent goals
3. See your active habits with streaks
4. Check last check-in date and rating
5. View your current pillar score
```

### Interact with Coach
```
1. Scroll to "Ask the {Pillar} Coach" section
2. Type your question in the textarea
3. Click "Send Message"
4. Wait for coach response (loading spinner)
5. See success message
6. Continue conversation (future)
```

### Log a Check-in
```
1. Scroll to "Last Check-in" section
2. If no check-in exists today:
   - Click "Check In Now" button
   - Or click emoji rating
3. Enter your rating (1-5)
4. Add optional notes
5. Click "Save Check-in"
6. See updated check-in display
```

## 🎨 Pillar Colors & Themes

Each pillar has a unique color scheme:

```javascript
PILLARS = {
  sleep: { color: "#6B46C1" },           // Purple
  diet: { color: "#52B788" },            // Green
  exercise: { color: "#FF5733" },        // Red-Orange
  physical_health: { color: "#FF7F50" }, // Coral
  mental_health: { color: "#4CC9F0" },   // Sky Blue
  finances: { color: "#2E8B57" },        // Sea Green
  social: { color: "#FFD700" },          // Gold
  spirituality: { color: "#7C3AED" }     // Violet
}
```

## 🔄 Real-Time Updates

**Auto-Refresh**:
- Goals, habits, check-ins updated when page loads
- Mutations trigger re-fetch of affected data
- No manual refresh needed

**Manual Refresh**:
- Browser refresh (F5) reloads all data
- Navigating away and back resets state

## 📊 Pillar Score Explained

**What It Measures** (Placeholder):
- Currently: `(goals.length * 10 + habits.length * 5) % 100`
- Future: Real scoring engine based on:
  - Goal progress percentages
  - Habit completion rates (weekly)
  - Check-in rating trends
  - Historical data

**Score Ranges**:
```
80-100  🌟 Excellent! Keep it up!
60-79   👍 Good progress, room to grow
40-59   💪 Getting there, stay consistent
0-39    🚀 Time to focus on this pillar!
```

## 🐛 Troubleshooting

### Dashboard Won't Load
```
❌ White screen
✅ Check browser console for errors
✅ Ensure you're logged in
✅ Verify JWT token in localStorage

❌ "404 Not Found"
✅ Verify route is spelled correctly
✅ Check router.jsx has the route
✅ Clear browser cache (Ctrl+Shift+Delete)
```

### Data Not Showing
```
❌ Empty goals list
✅ Create goals first in /Goals
✅ Ensure goal has pillar assigned
✅ Check goal status is "active"

❌ Coach message not sending
✅ Verify auth token exists
✅ Check console for API errors
✅ Ensure message is not empty

❌ Check-in not saving
✅ Verify you're logged in
✅ Check network tab for errors
✅ Try again or refresh page
```

### Wrong Colors/Styling
```
❌ Pillar color not showing
✅ Clear browser cache
✅ Hard refresh (Ctrl+Shift+R)
✅ Check PILLARS config in src/utils/pillars.js
```

## 🚀 Next Steps

### Add to Navigation
```javascript
// src/components/shared/Layout.jsx or Sidebar
<Link to="/pillar/sleep">Sleep Hub</Link>
<Link to="/pillar/diet">Nutrition Hub</Link>
// ... etc
```

### Create Pillar Quick Access
```javascript
// In Dashboard.jsx
{PILLARS.map(pillar => (
  <Link 
    key={pillar.id}
    to={`/pillar/${pillar.id}`}
    className="pillar-card"
    style={{ borderColor: pillar.color }}
  >
    {pillar.icon} {pillar.name}
  </Link>
))}
```

### Implement Scoring Engine
```javascript
// src/utils/scoring.js
export function calculatePillarScore(pillarId, data) {
  const { goals, habits, checkins } = data
  
  // Goal progress: 40%
  const goalScore = calculateGoalProgress(goals) * 0.4
  
  // Habit completion: 40%
  const habitScore = calculateHabitCompletion(habits) * 0.4
  
  // Check-in trends: 20%
  const checkinScore = calculateCheckinTrend(checkins) * 0.2
  
  return Math.round(goalScore + habitScore + checkinScore)
}
```

### Add Coach Response Display
```javascript
// Show coach response in modal/drawer
const [coachResponse, setCoachResponse] = useState(null)

async function handleCoachMessage() {
  const response = await fetch('/api/ai/orchestrator', ...)
  const data = await response.json()
  setCoachResponse(data.message)
  // Show modal with response
}
```

## 📚 Related Documentation

- `PILLAR_FOUNDATION_COMPLETE.md` - Full technical documentation
- `src/utils/pillars.js` - Pillar config and utilities
- `src/api/pillarClient.js` - API client for pillar data
- `src/pages/pillars/PillarDashboard.jsx` - Template component

## 💡 Best Practices

### For Users
1. **Set Goals First** - Create goals before checking dashboard
2. **Add Habits** - Build tracking habits for consistency
3. **Daily Check-ins** - Rate yourself daily for better insights
4. **Ask Coach** - Use AI coach for personalized advice
5. **Monitor Score** - Track pillar score over time

### For Developers
1. **Extend Template** - Don't duplicate code, use PillarDashboard
2. **Add Features** - Build pillar-specific features in wrappers
3. **Test Routes** - Verify all 8 routes work
4. **Handle Errors** - Gracefully handle API failures
5. **Optimize Queries** - Cache data appropriately

## ✅ Checklist

- [ ] Navigate to `/pillar/sleep` - See dashboard load
- [ ] See goals, habits, check-in, and score
- [ ] Send a coach message
- [ ] Log a check-in
- [ ] Try all 8 pillar routes
- [ ] Verify pillar colors are correct
- [ ] Test on mobile/responsive
- [ ] Check browser console for errors

---

**Status**: ✅ **READY TO USE**

All 8 pillar dashboards are live and waiting for user interaction!

Access any pillar at: `/pillar/{pillar-id}`
