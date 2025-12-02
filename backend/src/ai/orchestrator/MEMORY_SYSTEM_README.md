# NorthStar AI Memory System

## Overview

The Memory System provides persistent, per-user conversation context and data tracking across all 8 wellness pillars. It enables:

- **Anti-repetition**: Agents remember what topics they've covered
- **Context preservation**: Conversations build on previous interactions
- **Item tracking**: Created habits, goals, and screenings are remembered
- **Pillar isolation**: Each pillar maintains separate conversation history
- **Automatic persistence**: All data is saved after each interaction

## Architecture

### Storage
- **Development**: JSON files in `backend/data/memory/`
- **Production**: MongoDB User model (future integration)
- **Format**: One file per user: `{userId}.json`

### Memory Structure

```javascript
{
  userId: "user123",
  lastUpdated: "2025-12-02T23:00:00.000Z",
  pillars: {
    sleep: {
      lastMessages: [],        // Last 20 messages (10 turns)
      lastScreening: {},        // Most recent screening result
      preferences: {},          // User preferences for this pillar
      items: [],                // Created habits, goals, plans
      coveredTopics: []         // Anti-repetition tracking
    },
    mental_health: { /* same structure */ },
    nutrition: { /* same structure */ },
    fitness: { /* same structure */ },
    physical_health: { /* same structure */ },
    finances: { /* same structure */ },
    social: { /* same structure */ },
    spirituality: { /* same structure */ }
  },
  preferences: {},              // Global user preferences
  antiRepetition: {}            // Cross-pillar topic tracking
}
```

## API Reference

### Core Functions

#### `loadMemory(userId)`
Load user's memory from storage.

```javascript
import { loadMemory } from './orchestrator/memoryStore.js';

const memory = await loadMemory('user123');
```

**Returns**: Memory object (creates new if none exists)

---

#### `saveMemory(userId, memory)`
Save user's memory to storage.

```javascript
import { saveMemory } from './orchestrator/memoryStore.js';

await saveMemory('user123', memory);
```

**Parameters**:
- `userId` (string): User ID
- `memory` (object): Memory object to save

---

#### `updateConversationHistory(memory, pillar, userMessage, assistantMessage)`
Add conversation turn to memory.

```javascript
import { updateConversationHistory } from './orchestrator/memoryStore.js';

memory = updateConversationHistory(
  memory,
  'sleep',
  'I can\'t sleep',
  'Let me help you with that...'
);
```

**Auto-trimming**: Keeps only last 20 messages (10 turns)

---

#### `getConversationHistory(memory, pillar, limit)`
Retrieve conversation history for a pillar.

```javascript
import { getConversationHistory } from './orchestrator/memoryStore.js';

const history = getConversationHistory(memory, 'sleep', 10);
// Returns last 10 messages
```

---

#### `addItemToMemory(memory, pillar, item)`
Track created items (habits, goals, plans).

```javascript
import { addItemToMemory } from './orchestrator/memoryStore.js';

memory = addItemToMemory(memory, 'sleep', {
  type: 'habit',
  title: 'Go to bed at 10 PM',
  id: 'habit-123'
});
```

---

#### `markTopicCovered(memory, pillar, topic)`
Mark a topic as covered (anti-repetition).

```javascript
import { markTopicCovered } from './orchestrator/memoryStore.js';

memory = markTopicCovered(memory, 'sleep', 'sleep_hygiene_basics');
```

---

#### `isTopicCovered(memory, pillar, topic)`
Check if topic was covered in last 30 days.

```javascript
import { isTopicCovered } from './orchestrator/memoryStore.js';

if (isTopicCovered(memory, 'sleep', 'sleep_hygiene_basics')) {
  // Skip basic explanation, move to advanced topics
}
```

---

#### `updatePillarData(memory, pillar, key, value)`
Update pillar-specific data fields.

```javascript
import { updatePillarData } from './orchestrator/memoryStore.js';

memory = updatePillarData(memory, 'sleep', 'lastScreening', {
  name: 'Insomnia Severity Index',
  score: 15,
  date: new Date().toISOString()
});
```

---

#### `clearMemory(userId)`
Delete user's memory (for testing or privacy).

```javascript
import { clearMemory } from './orchestrator/memoryStore.js';

await clearMemory('user123');
```

## Integration with Orchestrator

The orchestrator automatically handles memory:

```javascript
import { runNorthStarAI } from './orchestrator/northstarOrchestrator.js';

// Memory is loaded, used, and saved automatically
const result = await runNorthStarAI({
  userId: 'user123',
  message: 'I can\'t sleep'
});
```

### Internal Flow

1. **Load Memory**: `loadMemory(userId)` called at start
2. **Get Context**: Conversation history retrieved for detected pillar
3. **Pass to Agent**: Memory included in agent context
4. **Update Memory**: New conversation turn added
5. **Save Memory**: `saveMemory(userId, memory)` called after response

## Anti-Repetition Strategy

### How It Works

1. **Topic Tracking**: When agent explains a concept, mark it covered
2. **Time Window**: Topics expire after 30 days
3. **Pillar Isolation**: Each pillar tracks separately
4. **Agent Awareness**: Agents check `isTopicCovered()` before explaining

### Example in Agent

```javascript
// Inside sleepAgent.js
export async function runSleepAgent({ context, userMessage, lastMessages }) {
  const { memory } = context;
  
  // Check if topic was already covered
  if (!isTopicCovered(memory, 'sleep', 'sleep_hygiene_basics')) {
    // First time - explain basics
    response = "Let me explain sleep hygiene...";
    markTopicCovered(memory, 'sleep', 'sleep_hygiene_basics');
  } else {
    // Already covered - skip to advanced
    response = "Building on what we discussed, let's try...";
  }
  
  return { text: response, model, meta: {} };
}
```

## Pillar-Specific Data Examples

### Sleep Pillar
```javascript
memory.pillars.sleep.lastScreening = {
  name: 'Insomnia Severity Index',
  score: 15,
  interpretation: 'Moderate insomnia',
  date: '2025-12-02T23:00:00.000Z'
};
```

### Mental Health Pillar
```javascript
memory.pillars.mental_health.lastProtocol = {
  name: 'GAD-7 Screening + CBT Protocol',
  score: 12,
  riskLevel: 'moderate',
  interventions: ['thought records', 'worry postponement']
};
```

### Nutrition Pillar
```javascript
memory.pillars.nutrition.lastMacroTarget = {
  protein: 140,
  carbs: 200,
  fats: 60,
  calories: 1900,
  goal: 'fat_loss'
};
```

### Fitness Pillar
```javascript
memory.pillars.fitness.lastProgram = {
  name: '12-Week Powerbuilding',
  phase: 'Week 4 - Hypertrophy Block',
  frequency: 4,
  lifts: { squat: 120, bench: 85, deadlift: 150 }
};
```

## Production Considerations

### MongoDB Integration (Future)

```javascript
// Convert to MongoDB model
const UserMemory = new Schema({
  userId: { type: String, required: true, unique: true },
  lastUpdated: Date,
  pillars: {
    sleep: { type: Object, default: {} },
    mental_health: { type: Object, default: {} },
    // ... other pillars
  },
  preferences: Object,
  antiRepetition: Object
});

// Update loadMemory/saveMemory to use MongoDB
export async function loadMemory(userId) {
  return await UserMemory.findOne({ userId }) || createEmptyMemory(userId);
}

export async function saveMemory(userId, memory) {
  await UserMemory.updateOne({ userId }, memory, { upsert: true });
}
```

### Performance Optimization

1. **Lazy Loading**: Only load memory when needed
2. **Partial Updates**: Update only changed pillars
3. **Compression**: Compress old messages (>30 days)
4. **Archiving**: Move old conversations to cold storage
5. **Caching**: Redis cache for frequently accessed users

### Privacy & GDPR

- **Retention**: Configurable data retention periods
- **Deletion**: `clearMemory()` for right-to-be-forgotten
- **Export**: Add `exportMemory(userId)` for data portability
- **Encryption**: Encrypt sensitive pillar data at rest

## Testing

Run the test suite:

```bash
node src/ai/orchestrator/memoryStoreTest.js
```

All tests include:
- Memory creation and loading
- Conversation history management
- Item tracking
- Topic coverage
- Pillar isolation
- Persistence verification

## File Locations

```
backend/
├── data/
│   └── memory/           # JSON storage (auto-created)
│       └── {userId}.json # One file per user
└── src/ai/
    └── orchestrator/
        ├── memoryStore.js              # Core memory system
        ├── memoryStoreTest.js          # Test suite
        ├── northstarOrchestrator.js    # Integrated orchestrator
        ├── orchestratorIntegrationTest.js  # Full integration test
        └── usageExamples.js            # Usage documentation
```

## Quick Start

```javascript
import { runNorthStarAI } from './orchestrator/northstarOrchestrator.js';

// That's it! Memory is automatic.
const result = await runNorthStarAI({
  userId: 'user123',
  message: 'Help me sleep better'
});
```

Memory system is production-ready and fully integrated! 🚀
