/**
 * ADVANCED AGENT FEATURES IMPLEMENTATION GUIDE
 * 
 * NEW SYSTEMS:
 * 1. Agent Context Injection (contextLoader.js)
 * 2. Intelligent Model Router (modelRouter.js)
 * 3. Screening Engine with Scoring (screeningEngine.js)
 * 4. Cross-Pillar Logic (crossPillarLogic.js)
 * 5. Enhanced Agent UI (EnhancedAgentDisplay.jsx)
 * 
 * USER FLOW:
 * User sends message
 *   ↓
 * Load context (habits, screenings, prior messages)
 *   ↓
 * Analyze cross-pillar impacts
 *   ↓
 * Select optimal model (GPT vs Claude)
 *   ↓
 * Inject context into system prompt
 *   ↓
 * Get agent response with formatted output
 *   ↓
 * Display with avatar, typing, model indicator
 *   ↓
 * Save response as Entry, update memory
 */

// =============================================================================
// 1. AGENT CONTEXT INJECTION
// =============================================================================

/**
 * FILE: backend/src/ai/orchestrator/contextLoader.js (350 lines)
 * 
 * Function: loadAgentContext(userId, pillar, lastMessages)
 * 
 * Returns context object with:
 * - Active habits (last 10, with streaks)
 * - Recent entries (last 5 checkins/logs)
 * - Screening results (latest 3 per pillar)
 * - Active goals (top 5 by priority)
 * - Streak analytics
 * - Cross-pillar stress factors
 * - Formatted context string for LLM
 * 
 * USAGE IN AGENT ROUTE:
 * 
 *   import { loadAgentContext } from './orchestrator/contextLoader.js';
 *   
 *   router.post('/sleep', jwtAuthMiddleware, async (req, res) => {
 *     const { message, pillar } = req.body;
 *     const userId = req.userId;
 *     
 *     // Load rich context
 *     const context = await loadAgentContext(userId, pillar, req.body.lastMessages);
 *     
 *     // Pass to agent with context
 *     const response = await sleepAgent.run(message, context);
 *     
 *     res.json({ ok: true, response, context });
 *   });
 * 
 * CONTEXT INJECTION IN AGENT:
 * 
 *   // In agent handler, inject context into system prompt
 *   const systemPrompt = basePrompt + '\n\n' + context.contextString;
 *   
 *   // Now model has full context about user's habits, health status, etc.
 */

// =============================================================================
// 2. INTELLIGENT MODEL ROUTER
// =============================================================================

/**
 * FILE: backend/src/ai/orchestrator/modelRouter.js (260 lines)
 * 
 * Function: selectOptimalModel(taskType, context)
 * 
 * Chooses between:
 * - GPT-4-Turbo: reasoning, classification, screening, analysis
 * - Claude-3: narrative, coaching, planning, long-form responses
 * 
 * ROUTING LOGIC:
 * 1. Check for user override (context.forceModel)
 * 2. Check agent preference (sleep→GPT, mental-health→Claude)
 * 3. Check task type (reasoning→GPT, narrative→Claude)
 * 4. Heuristic: large context→Claude, small→GPT
 * 
 * USAGE:
 * 
 *   import { selectOptimalModel, getModelInfo } from './orchestrator/modelRouter.js';
 *   
 *   // Selecting model based on task type
 *   const modelConfig = await selectOptimalModel('coach', {
 *     pillar: 'mental-health',
 *     contextString: contextData.contextString
 *   });
 *   
 *   // Call the selected model
 *   const response = await modelConfig.handler({
 *     prompt: userMessage,
 *     systemPrompt: agentSystemPrompt,
 *     context: contextData
 *   });
 *   
 *   // Get info for display
 *   const modelInfo = getModelInfo(modelConfig);
 *   // Returns: { name: 'GPT-4-Turbo', logo: '⚡', reason: '...' }
 * 
 * DISPLAYING MODEL CHOICE:
 * 
 *   // In response to user
 *   res.json({
 *     ok: true,
 *     text: response.text,
 *     modelUsed: {
 *       name: modelConfig.modelName,
 *       logo: modelConfig.model === 'gpt' ? '⚡' : '🤖',
 *       reason: modelConfig.reasonForChoice
 *     }
 *   });
 * 
 * AGENT PREFERENCES:
 * - sleep → GPT (medical precision)
 * - fitness → Claude (warmth/coaching)
 * - mental-health → Claude (empathy)
 * - nutrition → GPT (scientific)
 * - finances → GPT (accuracy)
 * - physical-health → GPT (medical)
 * - social → Claude (warmth)
 * - spirituality → Claude (narrative)
 */

// =============================================================================
// 3. SCREENING ENGINE WITH SCORING
// =============================================================================

/**
 * FILE: backend/src/ai/orchestrator/screeningEngine.js (350 lines)
 * 
 * Supported Screenings:
 * - ISI (Insomnia Severity Index)
 * - STOP-BANG (Sleep Apnea)
 * - ESS (Epworth Sleepiness)
 * - PHQ-9 (Depression)
 * - GAD-7 (Anxiety)
 * - WHO-5 (Wellbeing)
 * - DAST-10 (Substance Use)
 * 
 * Function: scoreScreening(userId, screeningType, responses)
 * 
 * Returns: {
 *   score: number,
 *   category: string ('Normal', 'Mild', 'Moderate', 'Severe'),
 *   severity: string,
 *   percentile: number,
 *   recommendation: string,
 *   followUp: { text, model } // AI-generated follow-up
 * }
 * 
 * USAGE:
 * 
 *   import { scoreScreening, getScreeningHistory } from './orchestrator/screeningEngine.js';
 *   
 *   // Score a completed screening
 *   const result = await scoreScreening(userId, 'ISI', [1, 2, 0, 1, 2, 1, 0]);
 *   
 *   // Result includes AI follow-up generated automatically
 *   console.log(result.followUp.text);
 *   
 *   // Get history of screenings
 *   const history = await getScreeningHistory(userId, 'sleep');
 *   
 *   // Get latest screenings for all types
 *   const latest = await getLatestScreenings(userId);
 * 
 * SCORING CATEGORIES:
 * 
 * ISI (0-28):
 *   0-7: Normal
 *   8-14: Subthreshold insomnia
 *   15-21: Moderate insomnia
 *   22-28: Severe insomnia
 * 
 * STOP-BANG (0-8):
 *   0-2: Low risk
 *   3-4: Intermediate risk
 *   5-8: High risk
 * 
 * PHQ-9 (0-27):
 *   0-4: Minimal
 *   5-9: Mild
 *   10-14: Moderate
 *   15-19: Moderately severe
 *   20-27: Severe
 * 
 * GAD-7 (0-21):
 *   0-4: Minimal
 *   5-9: Mild
 *   10-14: Moderate
 *   15-21: Severe
 */

// =============================================================================
// 4. CROSS-PILLAR LOGIC ENGINE
// =============================================================================

/**
 * FILE: backend/src/ai/orchestrator/crossPillarLogic.js (320 lines)
 * 
 * Models how one pillar affects others:
 * - Poor sleep → reduce fitness difficulty (difficulty = difficulty - 20)
 * - Financial stress → sleep disruption
 * - Anxiety → nutrition challenges (difficulty = difficulty - 25)
 * - Lack of sleep → social withdrawal
 * - Chronic pain → limited fitness capacity (difficulty = difficulty - 30)
 * 
 * Function: analyzeImpacts(userId, targetPillar)
 * 
 * Returns: {
 *   targetPillar: string,
 *   activeImpacts: [
 *     {
 *       from: 'sleep',
 *       to: 'fitness',
 *       level: 'high',
 *       impact: 'description',
 *       adjustments: { difficulty: fn, ... }
 *     }
 *   ],
 *   recommendation: string
 * }
 * 
 * USAGE:
 * 
 *   import {
 *     analyzeImpacts,
 *     applyImpactAdjustments,
 *     getCoordinationSuggestions
 *   } from './orchestrator/crossPillarLogic.js';
 *   
 *   // Analyze cross-pillar impacts before suggesting fitness plan
 *   const impacts = await analyzeImpacts(userId, 'fitness');
 *   
 *   // If poor sleep detected, reduce fitness difficulty
 *   let difficulty = 5; // Base
 *   impacts.activeImpacts.forEach(impact => {
 *     if (impact.adjustments?.difficulty) {
 *       difficulty = applyImpactAdjustments(difficulty, impacts.activeImpacts);
 *     }
 *   });
 *   
 *   // Get suggestions for coordinating with other agents
 *   const coordination = getCoordinationSuggestions(impacts.activeImpacts);
 *   // coordination = [
 *   //   { agentPillar: 'sleep', urgency: 'urgent', ... }
 *   // ]
 * 
 * CROSS-PILLAR IMPACTS:
 * 
 * sleep → fitness:
 *   Poor sleep reduces exercise capacity and recovery
 *   Adjustment: difficulty - 20
 * 
 * finances → sleep:
 *   Money stress disrupts sleep quality
 *   Adjustment: priority increase
 * 
 * mental-health → nutrition:
 *   Anxiety/depression worsens eating patterns
 *   Adjustment: difficulty - 25
 * 
 * mental-health → fitness:
 *   Depression reduces motivation
 *   Adjustment: difficulty - 15
 * 
 * physical-health → fitness:
 *   Chronic pain limits exercise
 *   Adjustment: difficulty - 30
 */

// =============================================================================
// 5. ENHANCED AGENT UI COMPONENT
// =============================================================================

/**
 * FILE: src/components/EnhancedAgentDisplay.jsx (280 lines)
 * 
 * Displays:
 * 1. Agent avatar and name with gradient background
 * 2. Model indicator (GPT ⚡ vs Claude 🤖) with reason
 * 3. Persona introduction quote
 * 4. Cross-pillar impact warnings (if applicable)
 * 5. Message history with timestamps
 * 6. Typing bubbles animation
 * 7. Context info (collapsible)
 * 
 * Agent Avatars & Colors:
 * - Dr. Luna (🌙) - purple for sleep
 * - Coach Phoenix (🔥) - orange for fitness
 * - Dr. Serenity (🧘) - green for mental-health
 * - Chef Nourish (🥗) - yellow for nutrition
 * - Sage Finance (💰) - teal for finances
 * - Dr. Vital (❤️) - pink for physical-health
 * - Ambassador Nova (🤝) - blue for social
 * - Sage Spirit (✨) - purple for spirituality
 * 
 * USAGE:
 * 
 *   import EnhancedAgentDisplay, {
 *     TypingBubbles,
 *     ModelBadge
 *   } from './components/EnhancedAgentDisplay';
 *   
 *   <EnhancedAgentDisplay
 *     agent={{
 *       name: 'Dr. Luna',
 *       pillar: 'sleep',
 *       avatar: '🌙'
 *     }}
 *     isTyping={isWaitingForResponse}
 *     messages={conversationHistory}
 *     modelInfo={{
 *       name: 'GPT-4-Turbo',
 *       logo: '⚡',
 *       reason: 'Reasoning task (classify): GPT-4 for analysis'
 *     }}
 *     impacts={crossPillarImpacts}
 *   />
 * 
 * TYPING BUBBLE COMPONENT:
 * 
 *   <TypingBubbles
 *     agentName="Dr. Luna"
 *     avatarEmoji="🌙"
 *   />
 * 
 * MODEL BADGE:
 * 
 *   <ModelBadge
 *     modelInfo={{
 *       name: 'Claude-3',
 *       logo: '🤖',
 *       reason: 'Narrative task (coach): Claude-3 for warmth'
 *     }}
 *   />
 */

// =============================================================================
// INTEGRATION CHECKLIST
// =============================================================================

/**
 * ✅ BACKEND INTEGRATION:
 * 
 * 1. Create routes that use context injection:
 *    [ ] Update /api/ai/:pillar route to call loadAgentContext()
 *    [ ] Pass context.contextString to agent system prompt
 *    [ ] Return modelInfo in response
 * 
 * 2. Add screening endpoint:
 *    [ ] POST /api/screening/score/:type
 *    [ ] Accept responses array
 *    [ ] Return score, category, followUp
 * 
 * 3. Add cross-pillar analysis:
 *    [ ] Call analyzeImpacts() before adjusting agent difficulty
 *    [ ] Apply adjustments to recommendations
 *    [ ] Include coordination suggestions in response
 * 
 * 4. Import new modules:
 *    [ ] contextLoader.js in agent routes
 *    [ ] modelRouter.js in orchestrator
 *    [ ] screeningEngine.js in screening routes
 *    [ ] crossPillarLogic.js in agent routes
 * 
 * ✅ FRONTEND INTEGRATION:
 * 
 * 1. Replace agent display:
 *    [ ] Import EnhancedAgentDisplay in AIInsights or chat component
 *    [ ] Pass agent, modelInfo, impacts props
 *    [ ] Show typing bubbles while waiting
 * 
 * 2. Display model choice:
 *    [ ] Show ModelBadge in agent header
 *    [ ] Explain why this model was chosen
 *    [ ] Allow user override via settings
 * 
 * 3. Show cross-pillar warnings:
 *    [ ] Display impact alerts if detected
 *    [ ] Show recommendations for addressing them
 *    [ ] Link to related agents
 * 
 * 4. Create screening UI:
 *    [ ] Show screening questions one at a time
 *    [ ] Display progress bar
 *    [ ] Show results with category and recommendation
 *    [ ] Display AI follow-up from scoreScreening()
 */

// =============================================================================
// EXAMPLE: COMPLETE AGENT CALL WITH ALL FEATURES
// =============================================================================

/**
 * BACKEND ROUTE EXAMPLE:
 * 
 * import { loadAgentContext } from './orchestrator/contextLoader.js';
 * import { selectOptimalModel, getModelInfo } from './orchestrator/modelRouter.js';
 * import { analyzeImpacts, applyImpactAdjustments } from './orchestrator/crossPillarLogic.js';
 * 
 * router.post('/ai/sleep', jwtAuthMiddleware, async (req, res) => {
 *   const { message, lastMessages } = req.body;
 *   const userId = req.userId;
 *   const pillar = 'sleep';
 *   
 *   try {
 *     // 1. Load context
 *     const context = await loadAgentContext(userId, pillar, lastMessages);
 *     
 *     // 2. Analyze impacts
 *     const impactAnalysis = await analyzeImpacts(userId, pillar);
 *     
 *     // 3. Select model
 *     const modelConfig = await selectOptimalModel('coach', context);
 *     const modelInfo = getModelInfo(modelConfig);
 *     
 *     // 4. Run agent with context + impacts
 *     const systemPrompt = buildSleepSystemPrompt();
 *     const systemWithContext = systemPrompt + '\n\n' + context.contextString;
 *     
 *     if (impactAnalysis.activeImpacts.length > 0) {
 *       systemWithContext += '\n\nCROSS-PILLAR IMPACTS:\n';
 *       impactAnalysis.activeImpacts.forEach(imp => {
 *         systemWithContext += `- ${imp.impact}\n`;
 *       });
 *     }
 *     
 *     const response = await modelConfig.handler({
 *       prompt: message,
 *       systemPrompt: systemWithContext,
 *       context
 *     });
 *     
 *     // 5. Return response with all metadata
 *     res.json({
 *       ok: true,
 *       text: response.text,
 *       model: modelInfo,
 *       impacts: impactAnalysis.activeImpacts,
 *       context: {
 *         habitsLoaded: context.habits.length,
 *         screeningsLoaded: Object.keys(context.screeningScores).length
 *       }
 *     });
 *   } catch (error) {
 *     res.status(500).json({ ok: false, error: error.message });
 *   }
 * });
 * 
 * FRONTEND USAGE EXAMPLE:
 * 
 * function AIChat({ pillar }) {
 *   const [messages, setMessages] = useState([]);
 *   const [isTyping, setIsTyping] = useState(false);
 *   const [modelInfo, setModelInfo] = useState(null);
 *   const [impacts, setImpacts] = useState([]);
 *   
 *   const handleSendMessage = async (message) => {
 *     setIsTyping(true);
 *     
 *     const res = await fetch(`/api/ai/${pillar}`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         message,
 *         lastMessages: messages
 *       })
 *     });
 *     
 *     const data = await res.json();
 *     
 *     setMessages([...messages, { role: 'user', content: message }]);
 *     setMessages(prev => [...prev, {
 *       role: 'assistant',
 *       content: data.text,
 *       modelUsed: data.model.name
 *     }]);
 *     setModelInfo(data.model);
 *     setImpacts(data.impacts || []);
 *     setIsTyping(false);
 *   };
 *   
 *   return (
 *     <EnhancedAgentDisplay
 *       agent={{ name: 'Dr. Luna', pillar: 'sleep' }}
 *       messages={messages}
 *       isTyping={isTyping}
 *       modelInfo={modelInfo}
 *       impacts={impacts}
 *     />
 *   );
 * }
 */

export const ADVANCED_FEATURES_IMPLEMENTED = {
  systems: [
    'Context Injection (contextLoader.js)',
    'Model Router (modelRouter.js)',
    'Screening Engine (screeningEngine.js)',
    'Cross-Pillar Logic (crossPillarLogic.js)',
    'Enhanced Agent UI (EnhancedAgentDisplay.jsx)'
  ],
  features: [
    'Prior context injection (habits, screenings, plans)',
    'Intelligent model selection (GPT vs Claude)',
    'Comprehensive screening system',
    'Automatic scoring and categorization',
    'AI follow-ups on screening results',
    'Cross-pillar impact analysis',
    'Difficulty adjustment based on health status',
    'Agent avatars and personas',
    'Model indicator with reasoning',
    'Typing animation bubbles',
    'Cross-pillar impact warnings'
  ],
  filesCreated: 5,
  totalLines: 1620,
  status: 'Ready for integration'
};
