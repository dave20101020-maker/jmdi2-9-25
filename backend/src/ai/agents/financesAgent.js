/**
 * Finances Agent - "Adviser Prosper"
 * 
 * Specialized AI agent for the Finances pillar, providing expert guidance on:
 * - Budgeting and expense tracking
 * - Debt management and payoff strategies
 * - Savings goals and emergency funds
 * - Financial planning and goal setting
 * - Money mindset and financial wellness
 * - Basic investing concepts
 */

import { runWithBestModel } from '../modelRouter.js';
import { buildMessageHistory } from './agentBase.js';
import { createAIItem } from '../data/createItem.js';

/**
 * Adviser Prosper System Prompt
 * 
 * This prompt defines the personality, expertise, and behavior
 * of the Finances pillar agent - a comprehensive AI financial wellness coach.
 */
export const financesSystemPrompt = `
=== ADVISER PROSPER - AI FINANCIAL WELLNESS SPECIALIST ===

**IDENTITY & INTRODUCTION:**
- Your default name is Adviser Prosper, but users can rename you to whatever they prefer
- **ALWAYS introduce yourself in your first message**: "Hey there! I'm Adviser Prosper, your AI money coach. I help you take control, kill debt, build wealth, and sleep better at night—no judgment, just strategy. I'm an AI trained in personal finance, behavioral economics, and wealth-building systems—not a licensed advisor or CPA, but I'm extremely good at this. Call me Prosper or rename me anything you want. What's the biggest money thing on your mind right now?"
- If user wants to rename you: "Love it—[new name] officially locked in. Let's make your money work harder."
- **Overlap redirect**: If user mentions tax strategy requiring a CPA, investment advice needing fiduciary oversight, bankruptcy, foreclosure, or anything legally complex → "That crosses into territory that needs a licensed professional. Let me connect you to NorthStar or directly to a human expert. I'll stay here for budgeting, debt destruction, savings automation, and wealth systems."

**Your Core Mission:** Get users from financial stress to financial power as fast and safely as possible using proven systems, automation, and behavioral hacks—while instantly redirecting anything that requires a regulated professional.

CORE BEHAVIOR:
- Calm, confident, zero-judgment money-bro energy
- Maximum 1–2 sharp questions—never an interrogation
- Turn every conversation into instantly trackable items (budgets, debt snowballs, automated transfers)
- Celebrate every dollar saved or paid off like it's a touchdown

ANTI-REPETITION RULES – CRITICAL:
1. Never re-explain 50/30/20, sinking funds, or "pay yourself first" once taught
2. Reference existing items by exact name: "How did cutting restaurants to $150 this month feel?"
3. Every reply must unlock a new lever, automation, or optimization

CONVERSATION PROGRESSION:
- **Week 1**: Identify the bleeding wound → launch core system (zero-based budget or debt snowball)
- **Week 2**: Check numbers → plug leaks and automate
- **Week 3**: Accelerate payoff or savings rate
- **Week 4**: Add wealth layer (Roth IRA, 401(k) max, high-yield accounts)
- **Month 2+**: Side income, tax-advantaged accounts, net-worth tracking, early retirement math

DATA INTEGRATION – CRITICAL:
- **Automatically create & save everything** with pillar='finances'
- You log every transaction, transfer, and milestone instantly
- Confirm instantly: "Just set up your $200 bi-weekly auto-transfer to Debt #2—Snowball updated."

EXPANDED CAPABILITIES (all auto-saved):
1. **Zero-Based Budget Builder** – every dollar assigned
2. **Debt Snowball vs. Avalanche Calculator** – live payoff date projector
3. **High-Yield & Automation Setup Guide** – exact steps for Ally, Capital One 360, etc.
4. **Sinking Fund System** – Christmas, car repairs, insurance in separate buckets
5. **Net-Worth Tracker** – monthly auto-update
6. **Emergency Fund Progress Bar** – 1 → 3 → 6 months expenses
7. **Side Hustle Idea Matrix** – filtered by time/skill/startup cost
8. **Subscription & Zombie Bill Hunter**
9. **Credit Score Action Plan** – exact steps to 800+
10. **Early Retirement / FI Calculator** – live FIRE number and years-to-goal

ITEM CREATION EXAMPLES (pillar='finances'):
- LifePlan: "Debt-Free in 18 Months"
- SmartGoal: "Pay off $8,400 Credit Card by Dec 2026"
- Habit: "$500 auto-transfer to HYSA every payday"
- Budget Category: "Restaurants – $200/month hard limit"
- Milestone: "Emergency Fund hit $5,000 – fully funded 3 months!"

EXAMPLE OVERLAP REDIRECT:
User: "Should I invest in Bitcoin or do a backdoor Roth?"
Adviser Prosper: "Crypto speculation and advanced tax strategies require a fiduciary advisor. Let me connect you to NorthStar for a human pro. I'll keep crushing your budget and debt in the meantime."

EXAMPLE FLOWS (anti-repetitive):
First contact → "I'm drowning in $28k credit card debt."
→ "Income and minimum payments?" → Build aggressive snowball + $1,200/month attack plan with exact payoff date.

Second contact → "Paid off Card #1!"
→ "Legend. Rolling $312 payment to Card #2—new payoff date moved up 4 months. Auto-transfer updated."

Third contact → "Debt gone—now what?"
→ "Time to build wealth. Opening Roth IRA + maxing 401(k) match = $11,500 free money this year. Want both accounts set up?"

KEEP IT:
- Calm, confident, celebratory tone
- Instant systems + instant tracking
- Legal/tax/investment gray areas → instant redirect
- Every reply moves the net-worth needle
- Zero shame, maximum momentum

You are now the sharpest, safest, most effective financial AI in the system. Welcome back, Adviser Prosper.
`.trim();

/**
 * Run the Finances Agent (Adviser Prosper)
 * 
 * @param {Object} params
 * @param {import('./agentBase.js').AgentContext} params.context - User context with finances pillar
 * @param {string} params.userMessage - User's current message
 * @param {Array} params.lastMessages - Recent conversation history
 * @returns {Promise<{text: string, model: string, meta: Object}>}
 */
export async function runFinancesAgent({ context, userMessage, lastMessages = [] }) {
  // Validate context
  if (!context || context.pillar !== 'finances') {
    throw new Error('runFinancesAgent requires context with pillar="finances"');
  }
  
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('runFinancesAgent requires a non-empty userMessage string');
  }

  // Determine task type based on message content
  const taskType = determineTaskType(userMessage);

  // Build message history with NorthStar context and Adviser Prosper personality
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt: financesSystemPrompt,
    lastMessages,
    extraSystemNotes: `Current user message is about: ${taskType}`
  });

  // Route to best model based on task type
  const result = await runWithBestModel({
    taskType,
    systemPrompt,
    userMessage,
    conversationHistory
  });

  // Return result with finances agent metadata
  return {
    text: result.text,
    model: result.model,
    meta: {
      pillar: 'finances',
      agentName: 'Adviser Prosper',
      taskType,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Determine task type for finances queries
 * 
 * Routing logic:
 * - 'deep_reasoning': Budget planning, debt payoff strategies, financial calculations
 * - 'emotional_coaching': Money anxiety, financial stress, shame, motivation
 * - 'mixed': General financial advice, tracking, goal setting (DEFAULT)
 * 
 * @param {string} message - User's message
 * @returns {'deep_reasoning' | 'emotional_coaching' | 'mixed'}
 */
function determineTaskType(message) {
  const lower = message.toLowerCase();

  // Deep reasoning keywords: Complex planning and calculations
  const deepReasoningKeywords = [
    'budget', 'budgeting', 'create a budget',
    'debt snowball', 'debt avalanche', 'debt payoff',
    'payment plan', 'payoff plan', 'payoff strategy',
    'calculate', 'calculation', 'how much should',
    'compound interest', 'interest rate',
    'amortization', 'loan payoff',
    'emergency fund', 'how much to save',
    'retirement planning', '401k contribution',
    'savings rate', 'savings goal',
    'financial plan', 'money plan',
    'allocation', 'allocate',
    'breakdown', 'break down',
    'prioritize', 'priority',
    'optimize', 'optimization',
    'compare', 'comparison',
    'avalanche', 'snowball'
  ];

  const hasDeepReasoning = deepReasoningKeywords.some(keyword => lower.includes(keyword));

  // Emotional coaching keywords: Financial anxiety and stress
  const emotionalKeywords = [
    'anxious', 'anxiety', 'worried', 'worry',
    'scared', 'afraid', 'fear', 'terrified',
    'overwhelmed', 'drowning', 'can\'t handle',
    'stressed', 'stress', 'panic', 'panicking',
    'ashamed', 'shame', 'embarrassed',
    'guilty', 'guilt', 'bad about',
    'hopeless', 'no hope', 'never get out',
    'failing', 'failure', 'failed',
    'depressed', 'depression',
    'give up', 'giving up', 'want to give up',
    'can\'t do this', 'too hard',
    'behind', 'falling behind',
    'compare', 'comparing myself',
    'not good enough', 'feeling poor',
    'reassurance', 'reassure me'
  ];

  const hasEmotional = emotionalKeywords.some(keyword => lower.includes(keyword));

  // Route based on detected keywords
  if (hasDeepReasoning && !hasEmotional) {
    return 'deep_reasoning';
  } else if (hasEmotional) {
    return 'emotional_coaching';
  } else {
    return 'mixed'; // Default: general advice, tracking, goal setting
  }
}

// ============================================================================
// HELPER FUNCTIONS
// Common financial coaching functions that can be called directly
// ============================================================================

/**
 * Create a personalized budget
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} financialInfo - User's financial information
 * @returns {Promise<{text: string, model: string}>}
 */
export async function createBudget(context, financialInfo = {}) {
  const { income, expenses = {}, goals = [], budgetMethod = '50/30/20' } = financialInfo;

  const expensesList = Object.entries(expenses)
    .map(([category, amount]) => `${category}: $${amount}`)
    .join('\n');

  const budgetMessage = `Help me create a ${budgetMethod} budget:
- Monthly income: $${income}
- Current expenses:
${expensesList}
- Financial goals: ${goals.join(', ') || 'building savings'}

Create a realistic budget plan that helps me reach my goals.`;

  return runFinancesAgent({
    context,
    userMessage: budgetMessage,
    lastMessages: []
  });
}

/**
 * Plan debt payoff strategy
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} debtInfo - Debt details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function planDebtPayoff(context, debtInfo) {
  const { debts = [], extraPayment = 0, method = 'snowball' } = debtInfo;

  const debtList = debts.map((debt, i) => 
    `Debt ${i + 1}: $${debt.balance} at ${debt.rate}% interest, minimum payment $${debt.minimum}`
  ).join('\n');

  const debtMessage = `Help me create a debt payoff plan using the ${method} method:
${debtList}

I can put $${extraPayment} extra toward debt each month. 
Create a step-by-step payoff strategy and show me when I'll be debt-free.`;

  return runFinancesAgent({
    context,
    userMessage: debtMessage,
    lastMessages: []
  });
}

/**
 * Plan emergency fund savings
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} savingsInfo - Savings goal information
 * @returns {Promise<{text: string, model: string}>}
 */
export async function planEmergencyFund(context, savingsInfo) {
  const { monthlyExpenses, currentSavings = 0, monthlySavings } = savingsInfo;

  const savingsMessage = `Help me build my emergency fund:
- Monthly expenses: $${monthlyExpenses}
- Current savings: $${currentSavings}
- Can save per month: $${monthlySavings}

How much should my emergency fund be? How long will it take to reach my goal? What milestones should I celebrate?`;

  return runFinancesAgent({
    context,
    userMessage: savingsMessage,
    lastMessages: []
  });
}

/**
 * Track spending and identify areas to save
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} spendingData - Recent spending information
 * @returns {Promise<{text: string, model: string}>}
 */
export async function analyzeSpending(context, spendingData) {
  const { period = 'last month', categories = {} } = spendingData;

  const spendingList = Object.entries(categories)
    .map(([category, amount]) => `${category}: $${amount}`)
    .join('\n');

  const spendingMessage = `Analyze my spending from ${period}:
${spendingList}

Where am I spending too much? What are realistic areas to cut back? How can I redirect that money toward my goals?`;

  return runFinancesAgent({
    context,
    userMessage: spendingMessage,
    lastMessages: []
  });
}

/**
 * Set financial goals with action steps
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} goalInfo - Financial goal details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function setFinancialGoal(context, goalInfo) {
  const { goal, targetAmount, targetDate, currentProgress = 0 } = goalInfo;

  const goalMessage = `Help me plan for this financial goal:
- Goal: ${goal}
- Target amount: $${targetAmount}
- Target date: ${targetDate}
- Current progress: $${currentProgress}

Break this down into monthly action steps. What do I need to save each month? What milestones should I set?`;

  return runFinancesAgent({
    context,
    userMessage: goalMessage,
    lastMessages: []
  });
}

/**
 * Understand investing basics
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} investingQuestion - Specific investing question
 * @returns {Promise<{text: string, model: string}>}
 */
export async function learnAboutInvesting(context, investingQuestion) {
  const investingMessage = `I want to learn about investing: ${investingQuestion}

Explain this in simple terms. What are the basics I need to know? What are my options? What should I consider?`;

  return runFinancesAgent({
    context,
    userMessage: investingMessage,
    lastMessages: []
  });
}

/**
 * Address money anxiety and financial stress
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {string} concern - Financial anxiety or concern
 * @returns {Promise<{text: string, model: string}>}
 */
export async function addressMoneyAnxiety(context, concern) {
  const anxietyMessage = `I'm feeling anxious about money: ${concern}

I need reassurance and practical steps to feel more in control of my finances. How can I reduce this financial stress?`;

  return runFinancesAgent({
    context,
    userMessage: anxietyMessage,
    lastMessages: []
  });
}

/**
 * Improve credit score understanding
 * 
 * @param {import('./agentBase.js').AgentContext} context
 * @param {Object} creditInfo - Credit situation details
 * @returns {Promise<{text: string, model: string}>}
 */
export async function improveCreditScore(context, creditInfo) {
  const { currentScore, goals = [], concerns = [] } = creditInfo;

  const creditMessage = `Help me understand and improve my credit score:
- Current score: ${currentScore}
- Goals: ${goals.join(', ') || 'general improvement'}
- Concerns: ${concerns.join(', ') || 'not sure where to start'}

What factors affect my credit score? What specific actions can I take to improve it?`;

  return runFinancesAgent({
    context,
    userMessage: creditMessage,
    lastMessages: []
  });
}

// ============================================================================
// DATA PERSISTENCE HELPERS
// ============================================================================

export async function saveLifePlan(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'finances',
    type: 'lifeplan',
    title,
    content,
    data: { ...data, agentName: 'Adviser Prosper' }
  });
}

export async function saveSmartGoal(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'finances',
    type: 'smartgoal',
    title,
    content,
    data: { ...data, agentName: 'Adviser Prosper' }
  });
}

export async function saveHabit(context, title, content, data = {}) {
  return createAIItem({
    userId: context.userId,
    pillar: 'finances',
    type: 'habit',
    title,
    content,
    data: { ...data, agentName: 'Adviser Prosper' }
  });
}
