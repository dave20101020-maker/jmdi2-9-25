# API Centralization Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     React Components / Pages                        │
│                                                                     │
│  - GoalCreator.jsx          - Diet.jsx         - VoiceInput.jsx   │
│  - ReflectionPrompt.jsx      - Exercise.jsx    - CoachPanel.jsx   │
│  - ThoughtRecorder.jsx       - Sleep.jsx       - etc.             │
└────────────────┬──────────────────────────────┬────────────────────┘
                 │                              │
        ┌────────▼──────────┐       ┌──────────▼──────────┐
        │   aiClient.js     │       │  pillarClient.js   │
        │                   │       │                    │
        │ - sendToOrch...   │       │ - createGoal       │
        │ - sendToPillar... │       │ - updateHabit      │
        │ - checkCrisis     │       │ - getCheckIns      │
        │ - getDailyPlan    │       │ - createEntry      │
        │ - analyzeSent...  │       │ - etc.             │
        └────────┬──────────┘       └──────────┬─────────┘
                 │                              │
                 └────────────┬─────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  apiConfig.js       │
                   │                     │
                   │ - AI_ENDPOINTS      │
                   │ - PILLAR_ENDPOINTS  │
                   │ - buildUrl()        │
                   │ - getAuthHeader()   │
                   │ - replacePathParams │
                   └──────────┬──────────┘
                              │
                   ┌──────────▼──────────┐
                   │   Fetch API         │
                   │  (with auth, etc.)  │
                   └──────────┬──────────┘
                              │
                   ┌──────────▼──────────┐
                   │   Backend APIs      │
                   │  (Express routes)   │
                   │                     │
                   │ - /api/ai/*         │
                   │ - /api/goals        │
                   │ - /api/habits       │
                   │ - /api/checkin      │
                   │ - /api/entries      │
                   │ - etc.              │
                   └─────────────────────┘
```

## Data Flow Examples

### Example 1: Creating a Goal

```
User clicks "Create Goal" in GoalCreator.jsx
         │
         ▼
handleSave() function
         │
         ├─ Imports: import * as pillarClient from '@/api/pillarClient'
         │
         ├─ Calls: pillarClient.createGoal(goalData)
         │           │
         │           ├─ fetchPillar(PILLAR_ENDPOINTS.GOALS, 'POST', goalData)
         │           │   │
         │           │   ├─ Imports: import { buildUrl, getAuthHeader } 
         │           │   │                    from '@/config/apiConfig'
         │           │   │
         │           │   ├─ Builds URL: buildUrl(PILLAR_ENDPOINTS.GOALS)
         │           │   │   → "http://localhost:5000/api/goals"
         │           │   │
         │           │   ├─ Gets Auth: getAuthHeader()
         │           │   │   → { Authorization: "Bearer jwt..." }
         │           │   │
         │           │   ├─ fetch(url, {
         │           │   │     method: 'POST',
         │           │   │     headers: { ...getAuthHeader() },
         │           │   │     body: JSON.stringify(goalData)
         │           │   │   })
         │           │   │
         │           │   └─ Returns parsed JSON
         │           │
         │           └─ Returns: { ok: true, goal: {...}, id: '123' }
         │
         ├─ Handle response:
         │   if (result.ok) {
         │     toast.success('Goal created!')
         │     onSuccess(result)
         │   } else {
         │     toast.error(result.message)
         │   }
         │
         └─ UI updates with new goal
```

### Example 2: Sending AI Message

```
User types message in Chat Component
         │
         ▼
onSendMessage() function
         │
         ├─ Imports: import * as aiClient from '@/api/aiClient'
         │
         ├─ Calls: aiClient.sendToOrchestrator(message, { pillar: 'fitness' })
         │           │
         │           ├─ fetchAI(AI_ENDPOINTS.ORCHESTRATOR, { message, pillar })
         │           │   │
         │           │   ├─ Imports: import { buildUrl, getAuthHeader }
         │           │   │                    from '@/config/apiConfig'
         │           │   │
         │           │   ├─ Builds URL: buildUrl(AI_ENDPOINTS.ORCHESTRATOR)
         │           │   │   → "http://localhost:5000/api/ai/orchestrator"
         │           │   │
         │           │   ├─ Gets Auth: getAuthHeader()
         │           │   │   → { Authorization: "Bearer jwt..." }
         │           │   │
         │           │   ├─ fetch(url, {
         │           │   │     method: 'POST',
         │           │   │     headers: { ...getAuthHeader() },
         │           │   │     body: JSON.stringify({ message, pillar })
         │           │   │   })
         │           │   │
         │           │   ├─ Response includes:
         │           │   │   { isCrisis: false, text: "...", agent: "coach" }
         │           │   │
         │           │   └─ Returns response
         │           │
         │           └─ Returns formatted response:
         │               { ok: true, text: "...", agent: "coach" }
         │               OR
         │               { ok: false, isCrisis: true, resources: [...] }
         │
         ├─ Handle response:
         │   if (response.isCrisis) {
         │     showCrisisModal(response)
         │   } else if (response.ok) {
         │     displayMessage(response.text)
         │   } else {
         │     displayError(response.message)
         │   }
         │
         └─ UI displays AI response or crisis resources
```

## Error Handling Flow

```
API Call Failed
         │
         ▼
fetch() throws error or returns error response
         │
         ├─ Try to parse as JSON
         │
         ├─ Create error object with { message, status, etc. }
         │
         ├─ Throw error
         │
         ▼
catch (error) block in aiClient/pillarClient
         │
         ├─ Imports: import { parseError, getUserFriendlyMessage }
         │           from '@/utils/errorHandling'
         │
         ├─ Parse error: parseError(error)
         │   Returns: { type: 'rateLimit' | 'network' | 'api', ...}
         │
         ├─ Get user message: getUserFriendlyMessage(parsedError)
         │   Returns: "Too many requests. Please try again in 45 seconds."
         │
         ├─ Get suggestions: getRecoverySuggestions(parsedError)
         │   Returns: ["Wait 45 seconds...", "Spread out requests...", ...]
         │
         └─ Return standardized error response:
             {
               ok: false,
               error: true,
               message: "Too many requests. Please try again in 45 seconds.",
               suggestions: ["Wait 45 seconds...", ...],
               statusCode: 429,
               originalError: { type: 'rateLimit', ... }
             }

Component receives error response
         │
         ├─ Check: if (!response.ok)
         │
         ├─ Display: toast.error(response.message)
         │
         ├─ Show: <ErrorAlert suggestions={response.suggestions} />
         │
         └─ Enable: <Button disabled={countdown > 0} />
```

## Configuration Resolution Order

```
API URL Resolution:
         │
         ├─ Start with: VITE_API_BASE_URL env variable
         │
         ├─ Fallback to: import.meta.env.VITE_API_BASE_URL
         │
         └─ Last resort: 'http://localhost:5000'

Example:
  buildUrl('/api/goals/:id', { id: '123' })
     │
     ├─ replacePathParams('/api/goals/:id', { id: '123' })
     │   └─ Returns: '/api/goals/123'
     │
     ├─ API_BASE_URL + path
     │   └─ 'http://localhost:5000' + '/api/goals/123'
     │
     └─ Final URL: 'http://localhost:5000/api/goals/123'
```

## Response Format Standardization

### Success Response (aiClient)
```javascript
{
  ok: true,
  text: "AI response text",
  agent: "coach",
  pillar: "fitness",
  model: "gpt-4",
  meta: {}
}
```

### Error Response (aiClient)
```javascript
{
  ok: false,
  error: true,
  message: "User-friendly error message",
  fallback: true,
  suggestions: ["Try this...", "Or try this..."],
  statusCode: 429
}
```

### Success Response (pillarClient)
```javascript
{
  ok: true,
  goal: { id: "123", title: "...", ... },
  id: "123"
}
```

### Error Response (pillarClient)
```javascript
{
  ok: false,
  error: true,
  message: "User-friendly error message",
  originalError: { type: 'rateLimit', ... },
  statusCode: 429
}
```

## Module Dependencies

```
pillarClient.js depends on:
  ├─ @/config/apiConfig
  │   ├─ PILLAR_ENDPOINTS
  │   ├─ OTHER_ENDPOINTS
  │   ├─ buildUrl()
  │   ├─ getAuthHeader()
  │   └─ replacePathParams()
  │
  └─ @/utils/errorHandling
      ├─ parseError()
      └─ getUserFriendlyMessage()

aiClient.js depends on:
  ├─ @/config/apiConfig
  │   ├─ AI_ENDPOINTS
  │   ├─ buildUrl()
  │   └─ getAuthHeader()
  │
  └─ @/utils/errorHandling
      ├─ parseError()
      ├─ getUserFriendlyMessage()
      └─ getRecoverySuggestions()

Components depend on:
  ├─ @/config/apiConfig (optional, for custom URLs)
  ├─ @/api/aiClient (for AI operations)
  ├─ @/api/pillarClient (for CRUD operations)
  └─ @/utils/errorHandling (optional, for custom error handling)
```

## Testing the System

### Test 1: Verify Endpoints Are Configured
```javascript
// In browser console
import { AI_ENDPOINTS, PILLAR_ENDPOINTS } from '@/config/apiConfig'
console.log(AI_ENDPOINTS.ORCHESTRATOR)  // '/api/ai/orchestrator'
console.log(PILLAR_ENDPOINTS.GOALS)     // '/api/goals'
```

### Test 2: Verify URL Building
```javascript
import { buildUrl } from '@/config/apiConfig'
console.log(buildUrl('/api/goals/123'))
// Should output: 'http://localhost:5000/api/goals/123'
```

### Test 3: Test AI Client
```javascript
import * as aiClient from '@/api/aiClient'
const response = await aiClient.sendToOrchestrator('Hello')
console.log(response)
// Should return: { ok: true, text: '...', agent: '...', ... }
```

### Test 4: Test Pillar Client
```javascript
import * as pillarClient from '@/api/pillarClient'
const result = await pillarClient.getGoals()
console.log(result)
// Should return: { ok: true, goals: [...], ... }
```

## Maintenance & Scaling

### Adding a New AI Endpoint
1. Add to `AI_ENDPOINTS` in `src/config/apiConfig.js`
2. Create function in `src/api/aiClient.js` that uses `fetchAI()`
3. Document in `API_CENTRALIZATION_GUIDE.md`

### Adding a New Pillar CRUD Type
1. Add endpoints to `PILLAR_ENDPOINTS` in `src/config/apiConfig.js`
2. Create CRUD functions in `src/api/pillarClient.js`
3. Follow the pattern: create, read, update, delete, list
4. Document in `API_CENTRALIZATION_GUIDE.md`

### Changing API Base URL
1. Set `VITE_API_BASE_URL` environment variable
2. No code changes needed - all calls use `buildUrl()`

### Rate Limiting Integration
- All API calls automatically include rate limit headers
- Errors from rate limiting are parsed as `type: 'rateLimit'`
- `getUserFriendlyMessage()` shows countdown timer
- `getRecoverySuggestions()` provides rate-limit-specific tips

---

**Created**: December 3, 2025
**Version**: 1.0
**Status**: Complete and Ready for Use
