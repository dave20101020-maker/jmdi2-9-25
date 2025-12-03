/**
 * PHASE 10 PART 3: ADVANCED AGENT FEATURES - QUICKSTART
 * 
 * What's New: 5 sophisticated systems for context-aware, intelligent agents
 * 
 * Timeline: 2-4 hours to integrate all systems into production
 * Complexity: High (but well-architected, straightforward integration points)
 * Impact: Agents become dramatically smarter, more personalized, more human-like
 */

// =============================================================================
// STEP 1: CREATE SCREENING ROUTE
// =============================================================================

/**
 * File: backend/routes/screening.js (NEW)
 * 
 * This route handles screening submissions and scoring
 */

const screeningRoute = `
import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';
import { scoreScreening, getScreeningHistory, getLatestScreenings } from '../src/ai/orchestrator/screeningEngine.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
router.use(jwtAuthMiddleware);

// POST /api/screening/:type
// Body: { responses: [0, 1, 2, 1, 0, 1, 2] }
// Returns: { score, category, severity, percentile, recommendation, followUp }
router.post('/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { responses } = req.body;
  const userId = req.userId;
  
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'Responses array required' });
  }
  
  const result = await scoreScreening(userId, type, responses);
  
  res.json({
    ok: true,
    screening: type,
    score: result.score,
    category: result.category,
    severity: result.severity,
    percentile: result.percentile,
    recommendation: result.recommendation,
    followUp: result.followUp
  });
}));

// GET /api/screening/history/:pillar
// Returns: { ok: true, history: [...] }
router.get('/history/:pillar', asyncHandler(async (req, res) => {
  const { pillar } = req.params;
  const userId = req.userId;
  
  const history = await getScreeningHistory(userId, pillar);
  
  res.json({
    ok: true,
    pillar,
    count: history.length,
    history
  });
}));

// GET /api/screening/latest
// Returns latest screening of each type
router.get('/latest', asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  const latest = await getLatestScreenings(userId);
  
  res.json({
    ok: true,
    screenings: latest
  });
}));

export default router;
`;

// =============================================================================
// STEP 2: REGISTER SCREENING ROUTE IN server.js
// =============================================================================

/**
 * In backend/server.js, add:
 * 
 *   import screeningRoutes from './routes/screening.js';
 *   
 *   app.use('/api/screening', screeningRoutes);
 */

// =============================================================================
// STEP 3: UPDATE SLEEP AGENT ROUTE WITH CONTEXT + MODEL ROUTER
// =============================================================================

/**
 * File: backend/routes/ai.js (MODIFY EXISTING)
 * 
 * Import new modules and create sleep-specific endpoint
 */

const sleepAgentRouteExample = `
import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';
import { loadAgentContext } from '../src/ai/orchestrator/contextLoader.js';
import { selectOptimalModel, getModelInfo } from '../src/ai/orchestrator/modelRouter.js';
import { analyzeImpacts } from '../src/ai/orchestrator/crossPillarLogic.js';
import asyncHandler from '../utils/asyncHandler.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();
router.use(jwtAuthMiddleware);

// POST /api/ai/sleep
router.post('/sleep', asyncHandler(async (req, res) => {
  const { message, lastMessages } = req.body;
  const userId = req.userId;
  const pillar = 'sleep';
  
  // 1. Load context (habits, screenings, prior messages)
  const context = await loadAgentContext(userId, pillar, lastMessages || []);
  
  // 2. Analyze cross-pillar impacts
  const impacts = await analyzeImpacts(userId, pillar);
  
  // 3. Select optimal model for this task
  const modelConfig = await selectOptimalModel('coach', {
    pillar,
    contextSize: context.contextString.length
  });
  const modelInfo = getModelInfo(modelConfig);
  
  // 4. Load sleep agent prompt from file
  const promptPath = path.join(process.cwd(), 'backend/agents/sleep.prompt.txt');
  const basePrompt = fs.readFileSync(promptPath, 'utf8');
  
  // 5. Build system prompt with context injection
  let systemPrompt = basePrompt;
  systemPrompt += '\\n\\nUSER CONTEXT:\\n' + context.contextString;
  
  if (impacts.activeImpacts.length > 0) {
    systemPrompt += '\\n\\nCROSS-PILLAR IMPACTS AFFECTING SLEEP:\\n';
    impacts.activeImpacts.forEach(imp => {
      systemPrompt += \`- From \\${imp.from}: \\${imp.impact}\\n\`;
    });
  }
  
  // 6. Call the selected model
  const response = await modelConfig.handler({
    prompt: message,
    systemPrompt: systemPrompt,
    context
  });
  
  // 7. Save response as Entry in database
  const Entry = require('../models/Entry.js').default;
  await Entry.create({
    userId,
    type: 'agent-response',
    pillar,
    content: response.text,
    metadata: {
      modelUsed: modelConfig.modelName,
      impactsConsidered: impacts.activeImpacts.length,
      contextLoaded: {
        habits: context.habits.length,
        screenings: Object.keys(context.screeningScores).length
      }
    }
  });
  
  // 8. Return response with all metadata
  res.json({
    ok: true,
    text: response.text,
    model: modelInfo,
    impacts: impacts.activeImpacts,
    context: {
      habitsLoaded: context.habits.length,
      screeningsLoaded: Object.keys(context.screeningScores).length,
      streakInfo: context.streak
    }
  });
}));

export default router;
`;

// =============================================================================
// STEP 4: CREATE CROSS-PILLAR ANALYSIS ROUTE
// =============================================================================

/**
 * File: backend/routes/impacts.js (NEW)
 * 
 * Expose cross-pillar impact analysis as API endpoint
 */

const impactsRouteExample = `
import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';
import { analyzeImpacts, getCoordinationSuggestions } from '../src/ai/orchestrator/crossPillarLogic.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
router.use(jwtAuthMiddleware);

// GET /api/impacts/:pillar
// Analyze what's affecting this pillar
router.get('/:pillar', asyncHandler(async (req, res) => {
  const { pillar } = req.params;
  const userId = req.userId;
  
  const impacts = await analyzeImpacts(userId, pillar);
  const coordination = getCoordinationSuggestions(impacts.activeImpacts);
  
  res.json({
    ok: true,
    pillar,
    impacts: impacts.activeImpacts,
    recommendation: impacts.recommendation,
    coordination
  });
}));

export default router;
`;

// =============================================================================
// STEP 5: INTEGRATE ENHANCED AGENT UI
// =============================================================================

/**
 * File: src/components/AIChat.jsx or similar (MODIFY EXISTING)
 * 
 * Replace existing agent display with EnhancedAgentDisplay
 */

const frontendIntegrationExample = `
import EnhancedAgentDisplay, {
  TypingBubbles,
  ModelBadge
} from './EnhancedAgentDisplay';

function AIChat({ pillar }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [impacts, setImpacts] = useState([]);
  
  const handleSendMessage = async (userMessage) => {
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);
    
    try {
      const res = await fetch(\`/api/ai/\${pillar}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          lastMessages: messages
        })
      });
      
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.text,
        modelUsed: data.model.name
      }]);
      setModelInfo(data.model);
      setImpacts(data.impacts || []);
    } finally {
      setIsTyping(false);
    }
  };
  
  const agentConfig = {
    'sleep': { name: 'Dr. Luna', avatar: '🌙' },
    'fitness': { name: 'Coach Phoenix', avatar: '🔥' },
    'mental-health': { name: 'Dr. Serenity', avatar: '🧘' },
    // ... etc
  };
  
  return (
    <EnhancedAgentDisplay
      agent={{
        name: agentConfig[pillar]?.name,
        pillar,
        avatar: agentConfig[pillar]?.avatar
      }}
      messages={messages}
      isTyping={isTyping}
      modelInfo={modelInfo}
      impacts={impacts}
      onSendMessage={handleSendMessage}
    />
  );
}
`;

// =============================================================================
// STEP 6: IMPLEMENTATION ORDER (PRIORITY)
// =============================================================================

const implementationOrder = {
  '1. BACKEND SCREENING (30 min)': [
    'Create routes/screening.js with 3 endpoints',
    'Register in server.js',
    'Test with /api/screening/ISI endpoint'
  ],
  
  '2. SLEEP AGENT UPDATE (45 min)': [
    'Import context loader, model router, cross-pillar logic',
    'Create POST /api/ai/sleep endpoint',
    'Load sleep.prompt.txt and inject context',
    'Select optimal model and call handler',
    'Save response to Entry collection',
    'Test with curl/Postman'
  ],
  
  '3. IMPACTS ENDPOINT (20 min)': [
    'Create routes/impacts.js',
    'Register in server.js',
    'Test GET /api/impacts/sleep'
  ],
  
  '4. FRONTEND DISPLAY (45 min)': [
    'Import EnhancedAgentDisplay into chat component',
    'Update component to receive modelInfo from API',
    'Display typing bubbles while waiting',
    'Show ModelBadge with model choice and reasoning',
    'Display cross-pillar impact warnings if present'
  ],
  
  '5. REPLICATE FOR OTHER AGENTS (2 hours)': [
    'Create fitness.prompt.txt and fitness.config.json',
    'Create POST /api/ai/fitness endpoint (clone sleep)',
    'Create mental-health.prompt.txt and config',
    'Create POST /api/ai/mental-health endpoint',
    '... repeat for remaining 5 pillars'
  ]
};

// =============================================================================
// VALIDATION CHECKLIST
// =============================================================================

const validationChecklist = {
  'Backend Created': [
    '✅ contextLoader.js (395 lines)',
    '✅ modelRouter.js (320 lines)',
    '✅ screeningEngine.js (339 lines)',
    '✅ crossPillarLogic.js (336 lines)',
    '✅ sleep.prompt.txt created',
    '✅ sleep.config.json created'
  ],
  
  'Frontend Created': [
    '✅ EnhancedAgentDisplay.jsx (280 lines)',
    '✅ TypingBubbles component',
    '✅ ModelBadge component'
  ],
  
  'Ready to Integrate': [
    '[ ] Screening route created and registered',
    '[ ] Sleep agent route updated with context/model',
    '[ ] Impacts endpoint created',
    '[ ] EnhancedAgentDisplay imported in AI chat',
    '[ ] All 5 agents updated (sleep + 4 others)',
    '[ ] Prompt files created for all agents',
    '[ ] Testing with real user data'
  ]
};

// =============================================================================
// EXAMPLE: COMPLETE USER FLOW
// =============================================================================

/**
 * USER FLOW:
 * 
 * 1. User opens AI Chat for Sleep
 *    → Frontend calls GET /api/impacts/sleep (shows current issues)
 *    → EnhancedAgentDisplay renders with Dr. Luna avatar
 * 
 * 2. User types: "I've been waking up at 3am every night"
 *    → Frontend displays message
 *    → Shows TypingBubbles (user knows agent is thinking)
 *    → Frontend POSTs to /api/ai/sleep with message
 * 
 * 3. Backend processes request:
 *    → loadAgentContext() gets last 5 habits, latest screenings, goal data
 *    → analyzeImpacts() checks if financial stress, anxiety, or poor fitness are affecting sleep
 *    → selectOptimalModel() returns GPT-4 (medical precision needed)
 *    → Loads sleep.prompt.txt system prompt
 *    → Injects context: "User has 3:30am average wake time, anxiety screening = Moderate, etc."
 *    → Calls GPT-4 with enriched context
 *    → Saves response as Entry
 * 
 * 4. Response returned to frontend:
 *    {
 *      "ok": true,
 *      "text": "3am wake-ups often indicate...",
 *      "model": {
 *        "name": "GPT-4-Turbo",
 *        "logo": "⚡",
 *        "reason": "Reasoning task (diagnose): GPT-4 for medical precision"
 *      },
 *      "impacts": [
 *        {
 *          "from": "mental-health",
 *          "level": "high",
 *          "impact": "Moderate anxiety (GAD-7 score 14) disrupts sleep"
 *        }
 *      ]
 *    }
 * 
 * 5. Frontend displays:
 *    → Agent name: Dr. Luna
 *    → Avatar: 🌙
 *    → Model badge: ⚡ GPT-4-Turbo (Reasoning)
 *    → Impact warning: 🔴 Anxiety detected: Moderate anxiety disrupts sleep
 *    → Response: "3am wake-ups often indicate..."
 *    → User can click impact to talk to Dr. Serenity (mental-health agent)
 */

export default {
  implementationOrder,
  validationChecklist,
  frontendIntegrationExample,
  sleepAgentRouteExample,
  screeningRoute,
  impactsRouteExample
};
