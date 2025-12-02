# Multi-Agent AI Coaching System

A sophisticated AI coaching system for NorthStar wellness app, featuring multiple specialized agents powered by OpenAI and Anthropic models.

## Architecture

```
backend/src/ai/
├── modelRouter.js          # Routes requests to OpenAI or Anthropic
├── agents/                 # Specialized coaching agents
│   ├── BaseAgent.js        # Parent class for all agents
│   ├── generalCoachAgent.js
│   ├── sleepCoachAgent.js
│   └── mentalHealthCoachAgent.js
└── orchestrator/           # Multi-agent coordination
    ├── agentOrchestrator.js    # Agent routing and execution
    └── contextManager.js        # User context and history
```

## Features

### 🤖 Intelligent Model Routing
- Automatically routes requests to OpenAI (GPT-4) or Anthropic (Claude)
- Task-based model selection for optimal performance
- Fallback handling and error recovery
- Support for both completion and streaming responses

### 👥 Specialized Agents
- **General Coach**: Cross-pillar wellness advice and initial interactions
- **Sleep Coach**: Sleep optimization, circadian rhythm, rest strategies
- **Mental Health Coach**: Stress management, CBT techniques, emotional support
- *More agents can be added easily*

### 🎯 Smart Orchestration
- Automatic agent routing based on user intent
- Multi-step workflows with multiple agents
- Crisis detection and escalation
- Context-aware responses

### 💾 Context Management
- User profile integration
- Recent activity tracking
- Conversation history
- Mood trend analysis
- Pillar-specific insights

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

Required packages (already installed):
- `openai` - OpenAI GPT models
- `@anthropic-ai/sdk` - Anthropic Claude models
- `dotenv` - Environment variables

### 2. Configure API Keys

Add to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get API keys:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/

### 3. Verify Configuration

```javascript
import { checkAPIKeys } from './src/ai/modelRouter.js';

const keys = checkAPIKeys();
console.log('API Keys configured:', keys);
// { openai: true, anthropic: true }
```

## Usage

### Basic Agent Interaction

```javascript
import { executeAgentRequest } from './src/ai/orchestrator/agentOrchestrator.js';

// Let the system choose the best agent
const response = await executeAgentRequest({
  userMessage: "I've been having trouble sleeping lately",
  context: {
    userId: user._id,
    includeProfile: true,
    includeScores: true,
  },
});

console.log(response.agentName); // "Sleep Coach"
console.log(response.response);  // AI-generated advice
```

### Specific Agent Invocation

```javascript
// Use a specific agent directly
const response = await executeAgentRequest({
  userMessage: "Create a bedtime routine for me",
  agentType: 'sleep',
  context: {
    wakeUpTime: '6:00 AM',
    sleepGoal: 8,
    constraints: 'I have a newborn',
  },
});
```

### Streaming Responses

```javascript
import { executeStreamingAgentRequest } from './src/ai/orchestrator/agentOrchestrator.js';

// Stream response in real-time
for await (const chunk of executeStreamingAgentRequest({
  userMessage: "Help me manage stress",
  agentType: 'mentalHealth',
  context: { userId: user._id },
})) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
  if (chunk.done) {
    console.log('\nComplete!');
  }
}
```

### Multi-Step Workflows

```javascript
import { executeWorkflow } from './src/ai/orchestrator/agentOrchestrator.js';

// Execute a coordinated workflow
const workflow = [
  {
    name: 'Assess Overall Wellness',
    agentType: 'general',
    task: 'Analyze my current wellness state',
  },
  {
    name: 'Sleep Optimization',
    agentType: 'sleep',
    task: 'Provide sleep improvement strategies',
    useContext: true, // Use results from previous steps
  },
  {
    name: 'Stress Management',
    agentType: 'mentalHealth',
    task: 'Suggest stress reduction techniques',
    useContext: true,
  },
];

const result = await executeWorkflow({
  workflow,
  context: { userId: user._id },
});

console.log(result.summary); // Synthesized insights from all agents
```

### Building Rich Context

```javascript
import { buildUserContext } from './src/ai/orchestrator/contextManager.js';

const context = await buildUserContext(userId, {
  includeProfile: true,
  includeScores: true,
  includeEntries: true,
  entriesLimit: 5,
  includeHabits: true,
});

// Context includes:
// - userProfile: { name, email, goals, preferences }
// - currentScores: { sleep: 75, diet: 60, ... }
// - recentEntries: [{ date, content, mood }]
// - activeHabits: [{ name, pillar, streak }]
```

### Direct Model Usage

```javascript
import { routeCompletion, MODELS } from './src/ai/modelRouter.js';

// Use a specific model directly
const response = await routeCompletion({
  model: MODELS.CLAUDE_35_SONNET,
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is cognitive behavioral therapy?' },
  ],
  temperature: 0.7,
  maxTokens: 500,
});

console.log(response.content);
console.log(response.provider); // 'anthropic'
console.log(response.usage);    // Token usage stats
```

## API Integration Example

Here's how to integrate with your Express routes:

```javascript
// In backend/routes/ai.js
import express from 'express';
import { executeAgentRequest, listAvailableAgents } from '../src/ai/orchestrator/agentOrchestrator.js';
import { buildUserContext } from '../src/ai/orchestrator/contextManager.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get list of available agents
router.get('/agents', authMiddleware, async (req, res) => {
  const agents = listAvailableAgents();
  res.json({ agents });
});

// Send message to AI coach
router.post('/coach', authMiddleware, async (req, res) => {
  try {
    const { message, agentType } = req.body;
    const userId = req.user.id;

    // Build context
    const context = await buildUserContext(userId, {
      includeProfile: true,
      includeScores: true,
      includeEntries: true,
      entriesLimit: 3,
    });

    // Execute request
    const response = await executeAgentRequest({
      userMessage: message,
      agentType,
      context,
    });

    res.json({
      success: true,
      agent: response.agentName,
      message: response.response,
      model: response.metadata.model,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

## Agent Capabilities

### General Coach
- Overall wellness assessment
- Cross-pillar advice
- Daily check-ins
- Goal setting support
- Progress celebration

### Sleep Coach
- Sleep pattern analysis
- Bedtime routine creation
- Sleep hygiene tips
- Circadian rhythm optimization
- Insomnia support (non-medical)

### Mental Health Coach
- Stress management techniques
- Cognitive reframing exercises
- Mindfulness guidance
- Mood tracking insights
- **Crisis detection and escalation**

## Safety Features

### Crisis Detection
The Mental Health Coach automatically detects crisis situations:

```javascript
const crisisCheck = await mentalHealthAgent.checkForCrisis({
  message: userMessage,
  moodHistory: recentMoods,
});

if (crisisCheck.isCrisis) {
  // Returns immediate professional help resources
  // - 988 Suicide & Crisis Lifeline
  // - Crisis Text Line
  // - Emergency room guidance
}
```

### Professional Boundaries
All agents clearly state they are NOT licensed professionals and recommend appropriate help when needed.

## Model Selection Guidelines

**Use Claude (Anthropic)** for:
- Complex reasoning and analysis
- Long-form content generation
- Nuanced emotional support
- Multi-step problem solving

**Use GPT-4 (OpenAI)** for:
- Creative tasks
- Conversational interactions
- Quick responses
- Broad knowledge queries

**Use GPT-3.5 (OpenAI)** for:
- Fast routing decisions
- Simple completions
- Cost-sensitive operations

## Performance Optimization

### Caching Recommendations
```javascript
// Cache user context for 5 minutes
const cacheKey = `context:${userId}`;
let context = await redis.get(cacheKey);

if (!context) {
  context = await buildUserContext(userId);
  await redis.set(cacheKey, JSON.stringify(context), 'EX', 300);
}
```

### Token Management
```javascript
// Monitor token usage
const response = await routeCompletion({...});
console.log('Tokens used:', response.usage.total_tokens);

// Limit maxTokens for cost control
const response = await executeAgentRequest({
  userMessage: "Brief advice please",
  options: { maxTokens: 200 }, // Keep response short
});
```

## Adding New Agents

1. **Create agent file** in `backend/src/ai/agents/`:

```javascript
import { BaseAgent } from './BaseAgent.js';
import { MODELS } from '../modelRouter.js';

const SYSTEM_PROMPT = `You are NorthStar's Nutrition Coach...`;

export class NutritionCoachAgent extends BaseAgent {
  constructor() {
    super({
      name: 'NutritionCoach',
      specialty: 'diet and nutrition planning',
      model: MODELS.CLAUDE_3_SONNET,
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  // Add custom methods as needed
  async createMealPlan({ dietaryRestrictions, goals }) {
    // ...
  }
}
```

2. **Register in orchestrator** (`agentOrchestrator.js`):

```javascript
import { NutritionCoachAgent } from '../agents/nutritionCoachAgent.js';

const agents = {
  general: new GeneralCoachAgent(),
  sleep: new SleepCoachAgent(),
  mentalHealth: new MentalHealthCoachAgent(),
  nutrition: new NutritionCoachAgent(), // Add here
};
```

3. **Update routing logic** to recognize new agent

## Testing

```javascript
// Test basic functionality
import { executeAgentRequest } from './src/ai/orchestrator/agentOrchestrator.js';

const testMessage = "I need help with my sleep schedule";

const response = await executeAgentRequest({
  userMessage: testMessage,
  context: {},
});

console.log('Agent selected:', response.agentName);
console.log('Response:', response.response);
```

## Error Handling

```javascript
try {
  const response = await executeAgentRequest({
    userMessage: "Help me",
    context: { userId },
  });
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle missing API key
    console.error('AI service not configured');
  } else if (error.message.includes('rate limit')) {
    // Handle rate limiting
    console.error('Too many requests');
  } else {
    // General error
    console.error('AI error:', error.message);
  }
}
```

## Cost Monitoring

Track AI usage costs:

```javascript
const response = await routeCompletion({...});

// Approximate costs (as of 2024)
const costs = {
  'gpt-4-turbo-preview': {
    input: 0.01 / 1000,  // $0.01 per 1K tokens
    output: 0.03 / 1000,
  },
  'claude-3-opus-20240229': {
    input: 0.015 / 1000,
    output: 0.075 / 1000,
  },
};

const modelCost = costs[response.model];
const totalCost = 
  (response.usage.prompt_tokens * modelCost.input) +
  (response.usage.completion_tokens * modelCost.output);

console.log(`Request cost: $${totalCost.toFixed(4)}`);
```

## Future Enhancements

- [ ] Conversation persistence and history
- [ ] Multi-language support
- [ ] Voice input/output integration
- [ ] Personalized system prompts based on user data
- [ ] A/B testing different models
- [ ] Caching for repeated queries
- [ ] Analytics and usage tracking
- [ ] Fine-tuned models for specific coaching tasks

## Troubleshooting

**No API keys configured:**
```
Error: OPENAI_API_KEY is not configured
```
→ Add keys to `.env` file

**Agent routing fails:**
```
Error: Unknown agent type: xyz
```
→ Check agent is registered in orchestrator

**High latency:**
- Use streaming for real-time feedback
- Cache user context
- Use GPT-3.5 for routing
- Consider shorter maxTokens

## Support

For issues or questions:
1. Check the error message and logs
2. Verify API keys are valid
3. Check model availability (some models may be deprecated)
4. Review token limits and quotas

## License

This AI system is part of the NorthStar wellness application.
