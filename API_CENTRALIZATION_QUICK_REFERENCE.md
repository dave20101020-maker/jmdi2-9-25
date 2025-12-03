# API Centralization - Quick Reference

## What Was Created

### 1. ✅ `src/config/apiConfig.js` (NEW)
**Purpose**: Central configuration for all API endpoints and URLs

**Key Features**:
- `API_BASE_URL` - Base URL for all API calls
- `AI_ENDPOINTS` - All AI service endpoints (orchestrator, coach, daily-plan, etc.)
- `PILLAR_ENDPOINTS` - Pillar CRUD endpoints (plans, goals, habits, check-ins, screenings)
- `AUTH_ENDPOINTS` - Authentication endpoints
- `OTHER_ENDPOINTS` - Additional endpoints (entries, friends, messages, etc.)
- `buildUrl()` - Helper to construct full URLs
- `getAuthHeader()` - Helper to get Authorization header with JWT
- `replacePathParams()` - Helper to replace `:id` style parameters in paths

**Usage**:
```javascript
import { AI_ENDPOINTS, buildUrl, getAuthHeader } from '@/config/apiConfig'
```

---

### 2. ✅ `src/api/aiClient.js` (REFACTORED)
**Purpose**: Centralized client for all AI-related API calls

**Exported Functions**:
- `sendToOrchestrator(message, options)` - Send message to main orchestrator
- `sendToPillarAgent(pillar, message, options)` - Send to specific pillar agent
- `checkCrisis(message)` - Detect crisis situations
- `getDailyPlan(message, options)` - Generate daily plan
- `getPillarAnalysis(message, options)` - Analyze a pillar
- `getWeeklyReflection(message, options)` - Get weekly reflection
- `analyzeSentiment(text)` - Analyze text sentiment
- `transcribeAudio(audioBlob)` - Convert audio to text

**Response Format**:
- Returns `{ ok: true, ... }` on success
- Returns `{ ok: false, error: true, message, suggestions }` on error
- Handles crisis detection, rate limiting, and all error scenarios

**Usage**:
```javascript
import * as aiClient from '@/api/aiClient'

const response = await aiClient.sendToOrchestrator('I need help', {
  pillar: 'mental-health',
  context: { /* data */ }
})
```

---

### 3. ✅ `src/api/pillarClient.js` (NEW)
**Purpose**: Centralized CRUD operations for pillar data

**Exported Functions**:

**Plans**:
- `createPlan(data)` - Create new life plan
- `getPlans(filters)` - Get all plans with optional filters
- `getPlan(id)` - Get specific plan
- `updatePlan(id, updates)` - Update plan
- `deletePlan(id)` - Delete plan

**Goals**:
- `createGoal(data)` - Create goal
- `getGoals(filters)` - Get all goals
- `getGoal(id)` - Get specific goal
- `updateGoal(id, updates)` - Update goal
- `deleteGoal(id)` - Delete goal

**Habits**:
- `createHabit(data)` - Create habit
- `getHabits(filters)` - Get all habits
- `getHabit(id)` - Get specific habit
- `updateHabit(id, updates)` - Update habit
- `deleteHabit(id)` - Delete habit
- `logHabitCompletion(habitId, date)` - Log habit completion

**Check-ins**:
- `createCheckIn(data)` - Create pillar check-in
- `getCheckIns(pillar, filters)` - Get check-ins for pillar

**Screenings**:
- `createScreening(data)` - Create screening/assessment
- `getScreenings(filters)` - Get screenings

**Entries** (Journal):
- `createEntry(data)` - Create journal entry
- `getEntries(filters)` - Get entries
- `updateEntry(id, updates)` - Update entry
- `deleteEntry(id)` - Delete entry

**Response Format**:
- Returns `{ ok: true, [item]: data, ... }` on success
- Returns `{ ok: false, error: true, message, originalError }` on error

**Usage**:
```javascript
import * as pillarClient from '@/api/pillarClient'

const result = await pillarClient.createGoal({
  title: 'Run a 5K',
  pillar: 'fitness',
  goalStatement: 'Complete a 5K race'
})
```

---

### 4. ✅ `API_CENTRALIZATION_GUIDE.md` (NEW)
**Purpose**: Complete implementation guide with before/after examples

**Contents**:
- Overview of new structure
- Detailed API configuration reference
- All aiClient functions with examples
- All pillarClient functions with examples
- Before & after refactoring examples
- Error handling patterns
- Migration checklist
- Files needing refactoring
- Testing instructions

---

## Current Status

### ✅ Completed
1. **API Configuration** - Centralized all endpoints in `src/config/apiConfig.js`
2. **AI Client** - Comprehensive AI service client with error handling
3. **Pillar Client** - Full CRUD operations for pillar data
4. **Error Handling** - Integrated with existing error utilities
5. **Authentication** - JWT token management via `getAuthHeader()`
6. **Documentation** - Complete guide with examples and patterns

### 🎯 Next Steps (Component Refactoring)
The following components need to be refactored to use the new clients:

**High Priority** (AI-related):
- `src/components/shared/GoalCreator.jsx` - Uses api.createGoal, api.aiCoach
- `src/components/shared/ReflectionPrompt.jsx` - Uses api.aiCoach
- `src/components/shared/ThoughtRecorder.jsx` - Uses api.aiCoach
- `src/components/shared/ValuesExercise.jsx` - Uses api calls

**Medium Priority** (Pillar pages):
- `src/pages/Diet.jsx` - Uses api.getMeals, api.createMeal
- `src/pages/Exercise.jsx` - Fitness tracking
- `src/pages/Sleep.jsx` - Sleep tracking
- `src/pages/PhysicalHealth.jsx` - Health tracking
- `src/pages/Mental.jsx` - Mental health tracking

**Components to Verify**:
- `src/components/VoiceInput.jsx` - Already uses apiClient correctly
- `src/components/ai/CoachPanel.jsx` - Uses api.ai() - can be updated to use aiClient
- Other existing clients already routing through backend correctly

---

## How to Use the New Clients

### For AI Operations
```javascript
import * as aiClient from '@/api/aiClient'

// Send message to orchestrator
const response = await aiClient.sendToOrchestrator('I need help with fitness', {
  pillar: 'fitness'
})

// Check for crisis
if (response.isCrisis) {
  showCrisisResources(response.resources)
} else if (response.ok) {
  displayAIResponse(response.text)
}
```

### For Pillar Data CRUD
```javascript
import * as pillarClient from '@/api/pillarClient'

// Create a goal
const result = await pillarClient.createGoal({
  title: 'My Fitness Goal',
  pillar: 'fitness',
  deadline: '2025-03-01'
})

if (result.ok) {
  console.log('Goal created:', result.goal)
} else {
  console.error(result.message)
}
```

### For Configuration
```javascript
import { buildUrl, replacePathParams } from '@/config/apiConfig'

// Build a URL with parameters
const url = buildUrl('/api/goals/:id', { id: '123' })
```

---

## Benefits of Centralization

1. **Single Source of Truth** - All API endpoints defined in one place
2. **Easy Maintenance** - Change API URLs in one file
3. **Consistent Error Handling** - All clients use same error parsing
4. **Standard Response Format** - Predictable { ok, error, message } format
5. **Rate Limiting Aware** - Integrated with rate limit detection
6. **Authentication** - JWT tokens automatically included
7. **Type Safety** - Clear function signatures and return types
8. **Documentation** - Each function has JSDoc comments with examples

---

## Migration Path

### Phase 1: ✅ COMPLETE
- Create config module
- Create AI client
- Create pillar client
- Document patterns

### Phase 2: IN PROGRESS
- Refactor GoalCreator.jsx
- Refactor ReflectionPrompt.jsx
- Refactor ThoughtRecorder.jsx
- Refactor pillar pages

### Phase 3: VERIFICATION
- Run integration tests
- Test error scenarios
- Verify rate limiting works
- Test all AI endpoints

### Phase 4: CLEANUP
- Remove old api calls where applicable
- Update documentation
- Archive old client code

---

## Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/config/apiConfig.js` | Central endpoint config | ✅ Created |
| `src/api/aiClient.js` | AI service client | ✅ Refactored |
| `src/api/pillarClient.js` | Pillar CRUD client | ✅ Created |
| `API_CENTRALIZATION_GUIDE.md` | Implementation guide | ✅ Created |
| `src/components/shared/GoalCreator.jsx` | Needs refactor | ⏳ TODO |
| `src/pages/Diet.jsx` | Needs refactor | ⏳ TODO |
| `src/components/shared/ReflectionPrompt.jsx` | Needs refactor | ⏳ TODO |

---

## Support

For detailed implementation patterns, see: **API_CENTRALIZATION_GUIDE.md**

For error handling patterns, see: **src/utils/errorHandling.js**

For rate limiting integration, see: **RATE_LIMITING_QUICK_START.md**

---

**Created**: December 3, 2025
**Status**: Infrastructure Complete, Component Refactoring In Progress
