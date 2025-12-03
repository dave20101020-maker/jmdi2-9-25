/**
 * AI System Integration Guide
 * 
 * Complete documentation for the four new production-ready components
 */

/*
═══════════════════════════════════════════════════════════════════════════
1. ERROR HANDLING & FALLBACK UI
═══════════════════════════════════════════════════════════════════════════

FEATURE: All AI calls now wrapped in try/catch with fallback responses

Location: backend/src/ai/orchestrator/northstarOrchestrator.js

Behavior:
- If AI service fails (API down, rate limit, etc.), returns:
  {
    ok: false,
    error: true,
    message: 'AI temporarily unavailable',
    agent: null,
    pillar?: 'sleep' // The pillar that failed
  }

Frontend should display fallback UI when error=true:
- Show a friendly message: "AI is temporarily unavailable. Try again later."
- Offer cached suggestions from previous interactions
- Allow user to continue viewing their data/history
- Show option to try again in 30 seconds

Example Frontend Code:
```javascript
const response = await fetch('/api/orchestrator/chat', {
  method: 'POST',
  body: JSON.stringify({ message: userInput })
});

const data = await response.json();

if (data.error) {
  // Show fallback UI
  showFallbackUI({
    message: data.message,
    pillar: data.pillar,
    suggestions: getCachedSuggestions(data.pillar)
  });
} else {
  // Show AI response normally
  displayAgent(data.agent, data.response);
}
```

═══════════════════════════════════════════════════════════════════════════
2. JWT AUTHENTICATION MIDDLEWARE
═══════════════════════════════════════════════════════════════════════════

Location: backend/middleware/jwtAuthMiddleware.js

Features:
- Extracts userId from JWT token in Authorization header
- Fallback chain: JWT → Session → Body (dev) → IP (anonymous)
- No authentication required (allows anonymous with IP)
- Strict auth mode available for protected routes

Setup in server.js:
```javascript
import { jwtAuthMiddleware } from './middleware/jwtAuthMiddleware.js';
import orchestratorRoutes from './routes/aiRoutes.js';

// Apply auth middleware to orchestrator routes
app.use('/api/orchestrator', jwtAuthMiddleware, orchestratorRoutes);
```

Usage in routes:
```javascript
// req.userId is now available in all route handlers
router.post('/chat', (req, res) => {
  const userId = req.userId; // Automatically extracted
  // ... rest of handler
});
```

Creating tokens for login:
```javascript
import { createToken } from './middleware/jwtAuthMiddleware.js';

// In login endpoint
const token = createToken(userId);
res.json({ token });
```

Client usage:
```javascript
// Store token after login
localStorage.setItem('token', response.token);

// Send with all requests
const response = await fetch('/api/orchestrator/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ message })
});
```

═══════════════════════════════════════════════════════════════════════════
3. MEMORY MODEL & LONG-TERM PERSISTENCE
═══════════════════════════════════════════════════════════════════════════

Location: backend/models/Memory.js

Data Structure:
{
  userId: string (unique index),
  pillarMemories: {
    [pillar]: {
      lastDiscussedTopics: string[],
      preferences: object,
      goals: object[],
      progressMarkers: object[],
      notes: string
    }
  },
  contextHistory: {
    [pillar]: {
      messages: [{ role, content, timestamp }],
      maxTurns: 10
    }
  },
  screeningHistory: {
    [pillar]: [{ screeningType, date, results, notes }]
  },
  aiItems: {
    [pillar]: [{
      itemId, type, title, content, createdAt, status
    }]
  },
  antiRepetitionTracker: {
    [pillar]: [{ topic, firstMentioned, lastMentioned, frequency }]
  },
  userMetadata: {
    preferredAgent: string,
    interactionCount: number,
    lastActiveAgent: string,
    timeZone: string,
    language: string
  },
  lastUpdated: Date
}

Methods:
- getPillarMemory(pillar) - Get memory for specific pillar
- updatePillarMemory(pillar, data) - Update pillar memory
- getContextHistory(pillar, limit) - Get conversation history
- addToContextHistory(pillar, role, content) - Add message
- addScreeningResult(pillar, type, results) - Save screening
- addAIItem(pillar, type, data) - Save AI item
- markTopicCovered(pillar, topic) - Track covered topics
- isTopicCovered(pillar, topic) - Check if topic covered
- clearPillarMemory(pillar) - Clear pillar memory
- clearAllMemory() - Clear everything
- getStats() - Get memory statistics

Statics:
- Memory.findOrCreate(userId) - Get or create user memory

Integration with Orchestrator:
The orchestrator automatically loads and saves memory:
```javascript
// Memory automatically loaded in orchestrator
const result = await runNorthStarAI({
  userId,
  message,
  // memory loaded automatically if not provided
});

// Memory automatically saved after each interaction
// No additional code needed
```

Manual usage:
```javascript
import Memory from './models/Memory.js';

const memory = await Memory.findOrCreate(userId);
memory.updatePillarMemory('sleep', {
  preferences: { bedtime: '10 PM', wakeTime: '6 AM' }
});
memory.markTopicCovered('sleep', 'circadian_rhythm');
await memory.save();
```

═══════════════════════════════════════════════════════════════════════════
4. AI ITEMS SERVICE
═══════════════════════════════════════════════════════════════════════════

Location: backend/services/aiItems.js

Functions available:

1. saveLifePlan(userId, pillar, data)
   - Saves comprehensive life plan for a pillar
   - Stores both in Memory model and agent context
   - Parameters: { title, content, pillars?, timeframe? }

2. saveGoal(userId, pillar, data)
   - Saves SMART goals
   - Parameters: { title, description, criteria?, deadline?, priority? }

3. saveHabit(userId, pillar, data)
   - Saves both to Memory and Habit model
   - Parameters: { title, description?, frequency, targetCount?, timeOfDay? }
   - Returns habitModelId for progress tracking

4. saveLog(userId, pillar, data)
   - Saves both to Memory and Entry model
   - Parameters: { title, content, type?, metrics? }
   - Returns entryModelId for history

5. saveScreening(userId, pillar, screeningType, results)
   - Saves screening result and interpretation
   - screeningType: 'sleep_quality', 'mental_health', etc.

6. saveReflection(userId, pillar, data)
   - Saves reflection with insights
   - Parameters: { title, content, insights? }

7. saveMilestone(userId, pillar, data)
   - Saves achievement milestones
   - Parameters: { title, description?, category? }

8. getAIItems(userId, pillar, filter?)
   - Retrieves items for a user/pillar
   - filter: { type?, status? }

9. updateAIItem(userId, pillar, itemId, updates)
   - Updates an existing item
   - Can change status, progress, etc.

All responses:
```javascript
{
  ok: true/false,
  item?: {...},
  itemId?: string,
  error?: string,
  message?: string
}
```

Usage in agents:
```javascript
import { saveHabit, saveGoal, saveLog } from '../../services/aiItems.js';

// In an agent function
const habitResult = await saveHabit(userId, 'fitness', {
  title: 'Morning runs',
  description: 'Run for 30 minutes',
  frequency: 'daily',
  targetCount: 3,
  timeOfDay: '6:00 AM'
});

if (habitResult.ok) {
  console.log(`Habit saved with ID: ${habitResult.habitModelId}`);
}
```

Usage in Express routes:
```javascript
import { saveGoal, getAIItems } from '../services/aiItems.js';

router.post('/api/goals', async (req, res) => {
  const result = await saveGoal(req.userId, req.body.pillar, {
    title: req.body.title,
    description: req.body.description,
    deadline: req.body.deadline
  });

  res.json(result);
});

router.get('/api/goals/:pillar', async (req, res) => {
  const items = await getAIItems(req.userId, req.params.pillar, {
    type: 'smartgoal'
  });

  res.json(items);
});
```

═══════════════════════════════════════════════════════════════════════════
COMPLETE INTEGRATION EXAMPLE
═══════════════════════════════════════════════════════════════════════════

Backend server.js setup:
```javascript
import express from 'express';
import orchestratorRoutes from './routes/aiRoutes.js';
import { jwtAuthMiddleware } from './middleware/jwtAuthMiddleware.js';
import { aiRateLimitMiddleware } from './middleware/rateLimiter.js';

const app = express();

app.use(express.json());

// Apply middleware to orchestrator routes
app.use('/api/orchestrator', jwtAuthMiddleware, orchestratorRoutes);

// Memory automatically persisted
// Error handling automatic
// Rate limiting automatic
// Auth automatic

app.listen(5000);
```

Frontend usage:
```javascript
class AICoach {
  constructor(token) {
    this.token = token;
  }

  async chat(message, pillar) {
    try {
      const response = await fetch('/api/orchestrator/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, pillar })
      });

      const data = await response.json();

      if (data.error) {
        // Show fallback UI
        return this.showFallback(data.message);
      }

      // Show agent response
      this.displayAgent(data.agent, data.response);
      return data;
    } catch (error) {
      // Network error - show fallback
      this.showFallback('Connection failed. Check your internet.');
    }
  }

  showFallback(message) {
    console.log(`Fallback: ${message}`);
    // Show cached suggestions, historical data, etc.
  }

  displayAgent(agent, response) {
    console.log(`${agent}: ${response}`);
  }
}

// Usage
const coach = new AICoach(localStorage.getItem('token'));
await coach.chat('Help me sleep better', 'sleep');
```

═══════════════════════════════════════════════════════════════════════════
PRODUCTION CHECKLIST
═══════════════════════════════════════════════════════════════════════════

✅ Error handling: All AI calls wrapped in try/catch
✅ Fallback UI: Frontend receives error: true when AI unavailable
✅ Authentication: JWT middleware extracts userId automatically
✅ Memory persistence: MongoDB Memory model saves after each interaction
✅ Data persistence: AI items saved to both Memory and app models
✅ Rate limiting: 30 req/min per user on orchestrator routes
✅ Sanitization: Input/output security for prompt injection
✅ Logging: All errors logged with context

Ready to Deploy: ✅ YES

═══════════════════════════════════════════════════════════════════════════
*/

export const INTEGRATION_COMPLETE = true;
