# API Centralization - Implementation Guide

## Overview

All API calls have been centralized into three main client modules:
1. **apiConfig.js** - Central configuration for all API endpoints and URLs
2. **aiClient.js** - All AI-related API calls (orchestrator, agents, crisis detection, etc.)
3. **pillarClient.js** - All pillar CRUD operations (plans, goals, habits, check-ins, screenings)

This guide shows how to refactor components to use these centralized clients instead of making direct API calls.

---

## 1. API Configuration (`src/config/apiConfig.js`)

All API URLs are defined in one place for easy maintenance.

### Import and Use

```javascript
import { 
  AI_ENDPOINTS, 
  PILLAR_ENDPOINTS, 
  AUTH_ENDPOINTS,
  OTHER_ENDPOINTS,
  buildUrl,
  getAuthHeader,
  replacePathParams 
} from '@/config/apiConfig'
```

### Available Endpoints

#### AI Endpoints
```javascript
AI_ENDPOINTS.ORCHESTRATOR           // /api/ai/orchestrator
AI_ENDPOINTS.COACH                  // /api/ai/coach
AI_ENDPOINTS.DAILY_PLAN             // /api/ai/daily-plan
AI_ENDPOINTS.CRISIS_CHECK           // /api/ai/crisis-check
AI_ENDPOINTS.SENTIMENT              // /api/ai/sentiment
AI_ENDPOINTS.TRANSCRIBE             // /api/ai/transcribe
```

#### Pillar Endpoints
```javascript
PILLAR_ENDPOINTS.PLANS              // /api/plans
PILLAR_ENDPOINTS.GOALS              // /api/goals
PILLAR_ENDPOINTS.HABITS             // /api/habits
PILLAR_ENDPOINTS.CHECKINS           // /api/checkin
PILLAR_ENDPOINTS.SCREENINGS         // /api/screenings
```

---

## 2. AI Client (`src/api/aiClient.js`)

Use for all AI-related operations.

### Functions

#### `sendToOrchestrator(message, options)`
Send a message to the main orchestrator for AI processing.

```javascript
import * as aiClient from '@/api/aiClient'

// Simple usage
const response = await aiClient.sendToOrchestrator('I need help with fitness')

// With options
const response = await aiClient.sendToOrchestrator('Help me sleep better', {
  pillar: 'sleep',
  context: { currentHours: 5 },
  lastMessages: []
})

// Handle response
if (response.isCrisis) {
  // Handle crisis situation
  displayCrisisResources(response.resources)
} else if (response.ok) {
  console.log(response.text)  // AI response
  console.log(response.agent)  // Which agent responded
} else {
  console.log(response.message)  // Error message
  console.log(response.suggestions)  // Recovery suggestions
}
```

#### `sendToPillarAgent(pillar, message, options)`
Send a message to a specific pillar agent.

```javascript
const response = await aiClient.sendToPillarAgent('fitness', 'Create a workout plan', {
  context: { fitnessLevel: 'intermediate' }
})
```

#### `checkCrisis(message)`
Check if a message indicates a crisis situation.

```javascript
const result = await aiClient.checkCrisis(userMessage)
if (result.isCrisis) {
  showCrisisModal(result)
}
```

#### `getDailyPlan(message, options)`
Get AI-generated daily plan.

```javascript
const plan = await aiClient.getDailyPlan('Plan my day', {
  goals: userGoals,
  timeAvailable: 16  // hours
})
```

#### `getPillarAnalysis(message, options)`
Get analysis of a pillar.

```javascript
const analysis = await aiClient.getPillarAnalysis('How is my fitness?', {
  scores: { fitness: 7, strength: 8 },
  focusAreas: ['cardio']
})
```

#### `analyzeSentiment(text)`
Analyze sentiment of text.

```javascript
const result = await aiClient.analyzeSentiment('I feel great today!')
console.log(result.sentiment)  // 'positive', 'negative', 'neutral'
```

#### `transcribeAudio(audioBlob)`
Transcribe audio blob to text.

```javascript
const result = await aiClient.transcribeAudio(audioBlob)
if (result.ok) {
  console.log(result.text)
}
```

---

## 3. Pillar Client (`src/api/pillarClient.js`)

Use for CRUD operations on pillar data.

### Plans

```javascript
import * as pillarClient from '@/api/pillarClient'

// Create a plan
const result = await pillarClient.createPlan({
  title: 'Annual Fitness Plan',
  description: 'Get fit in 2025',
  pillar: 'fitness',
  content: 'Detailed plan content...',
  timeframe: '1 year'
})

// Get all plans
const { plans } = await pillarClient.getPlans({
  pillar: 'fitness',
  status: 'active'
})

// Get one plan
const { plan } = await pillarClient.getPlan(planId)

// Update plan
const result = await pillarClient.updatePlan(planId, {
  title: 'Updated Title',
  status: 'completed'
})

// Delete plan
await pillarClient.deletePlan(planId)
```

### Goals

```javascript
// Create goal
const result = await pillarClient.createGoal({
  title: 'Run a 5K',
  description: 'Complete a 5K race',
  pillar: 'fitness',
  goalStatement: 'Run 5K without stopping',
  specific: 'Run 5 kilometers',
  measurable: 'Track via GPS or app',
  achievable: 'Train 3x per week',
  relevant: 'Improves fitness',
  timeBound: 'Within 3 months',
  deadline: '2025-03-01',
  priority: 'high'
})

// Get goals
const { goals } = await pillarClient.getGoals({
  pillar: 'fitness',
  status: 'active'
})

// Get one goal
const { goal } = await pillarClient.getGoal(goalId)

// Update goal
await pillarClient.updateGoal(goalId, {
  progress: 50,
  status: 'in-progress'
})

// Delete goal
await pillarClient.deleteGoal(goalId)
```

### Habits

```javascript
// Create habit
const result = await pillarClient.createHabit({
  title: 'Morning Run',
  description: '30-minute jog',
  pillar: 'fitness',
  frequency: 'daily',
  targetCount: 1,
  timeOfDay: '6:00 AM',
  reminder: true
})

// Get habits
const { habits } = await pillarClient.getHabits({
  pillar: 'fitness'
})

// Log completion
await pillarClient.logHabitCompletion(habitId, '2025-12-03')

// Update habit
await pillarClient.updateHabit(habitId, {
  status: 'paused'
})
```

### Check-ins

```javascript
// Create check-in
const result = await pillarClient.createCheckIn({
  pillar: 'fitness',
  score: 8,  // 1-10
  notes: 'Great workout today!',
  mood: 'energized',
  metrics: {
    workout_duration: 45,
    calories_burned: 500
  }
})

// Get check-ins for pillar
const { checkIns } = await pillarClient.getCheckIns('fitness', {
  days: 30
})
```

### Entries (Journal)

```javascript
// Create entry
const result = await pillarClient.createEntry({
  title: 'Workout Reflection',
  content: 'Today I ran 5K...',
  pillar: 'fitness',
  type: 'journal',  // journal, reflection, note
  mood: 'energized',
  tags: ['running', 'achievement']
})

// Get entries
const { entries } = await pillarClient.getEntries({
  pillar: 'fitness',
  type: 'journal',
  days: 7
})

// Update entry
await pillarClient.updateEntry(entryId, {
  content: 'Updated content...'
})

// Delete entry
await pillarClient.deleteEntry(entryId)
```

---

## Before & After Examples

### Example 1: Refactoring GoalCreator

**BEFORE** (Direct API calls):
```javascript
import { api } from "@/utils/apiClient"

const handleSave = async () => {
  const newGoal = await api.createGoal(goalData)
  const plan = await api.getPlans({ id: linkedPlanId })
  await api.updatePlan(linkedPlanId, { smartGoalIds: [...] })
}

const handleGenerateSmart = async () => {
  const result = await api.aiCoach({ prompt })
}
```

**AFTER** (Using centralized clients):
```javascript
import * as aiClient from '@/api/aiClient'
import * as pillarClient from '@/api/pillarClient'

const handleSave = async () => {
  const newGoal = await pillarClient.createGoal(goalData)
  const { plan } = await pillarClient.getPlan(linkedPlanId)
  await pillarClient.updatePlan(linkedPlanId, { smartGoalIds: [...] })
}

const handleGenerateSmart = async () => {
  const result = await aiClient.sendToOrchestrator(prompt, {
    pillar: selectedPillar
  })
}
```

### Example 2: Refactoring Pillar Page (Diet.jsx)

**BEFORE**:
```javascript
import { api } from "@/utils/apiClient"

const { data: meals } = useQuery({
  queryKey: ['meals', user?.email],
  queryFn: () => api.getMeals({ userId: user?.email }),
})

const saveMealMutation = useMutation({
  mutationFn: (data) => api.createMeal(data)
})
```

**AFTER**:
```javascript
import * as pillarClient from '@/api/pillarClient'

const { data: entries } = useQuery({
  queryKey: ['meals', user?.email],
  queryFn: () => pillarClient.getEntries({ 
    pillar: 'diet',
    type: 'meal'
  })
})

const saveMealMutation = useMutation({
  mutationFn: (data) => pillarClient.createEntry({
    ...data,
    type: 'meal',
    pillar: 'diet'
  })
})
```

---

## Error Handling

All clients return standardized responses:

```javascript
const response = await pillarClient.createGoal(data)

if (response.ok) {
  // Success
  console.log(response.goal)
} else {
  // Error
  console.log(response.message)  // User-friendly message
  console.log(response.originalError)  // Parsed error details
}
```

---

## Migration Checklist

- [ ] Replace `import { api } from "@/utils/apiClient"` with specific clients
- [ ] Update all API calls to use client functions
- [ ] Test error handling with rate-limited requests
- [ ] Verify all pillar pages work correctly
- [ ] Test AI components (orchestrator, sentiment, transcribe)
- [ ] Update any remaining direct fetch calls
- [ ] Run full test suite

---

## Files Using Old API Pattern

These files still need refactoring:
- `src/components/shared/GoalCreator.jsx` - Uses api.createGoal, api.getPlans
- `src/components/shared/ReflectionPrompt.jsx` - Uses api.aiCoach
- `src/components/shared/ThoughtRecorder.jsx` - Uses api.aiCoach
- `src/pages/Diet.jsx` - Uses api.getMeals, api.createMeal
- `src/pages/Exercise.jsx` - Uses api.*
- `src/pages/Sleep.jsx` - Uses api.*
- `src/components/shared/ValuesExercise.jsx` - Uses api calls

---

## Testing

Test the new clients in the browser console:

```javascript
// Test AI client
const res = await aiClient.sendToOrchestrator('Hello')
console.log(res)

// Test Pillar client
const goals = await pillarClient.getGoals()
console.log(goals)
```

---

## Next Steps

1. Refactor remaining components systematically
2. Run integration tests
3. Monitor error rates and rate limiting
4. Update any other direct fetch calls
5. Remove legacy api.js utilities once migration is complete
