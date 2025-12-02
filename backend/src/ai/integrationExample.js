/**
 * AI System Integration Example
 * 
 * This file demonstrates how to integrate the multi-agent AI system
 * into your Express routes and controllers.
 */

import express from 'express';
import { 
  executeAgentRequest, 
  executeStreamingAgentRequest,
  executeWorkflow,
  listAvailableAgents 
} from './orchestrator/agentOrchestrator.js';
import { 
  buildUserContext, 
  analyzeMoodTrends,
  getPillarActivity 
} from './orchestrator/contextManager.js';
import { checkAPIKeys, MODELS, getRecommendedModel } from './modelRouter.js';

const router = express.Router();

// Middleware to check AI service availability
const checkAIService = (req, res, next) => {
  const keys = checkAPIKeys();
  if (!keys.openai && !keys.anthropic) {
    return res.status(503).json({
      success: false,
      error: 'AI service is not configured. Please contact administrator.',
    });
  }
  next();
};

/**
 * GET /api/ai/status
 * Check AI service status and available agents
 */
router.get('/status', (req, res) => {
  const keys = checkAPIKeys();
  const agents = listAvailableAgents();

  res.json({
    success: true,
    status: {
      openai: keys.openai ? 'configured' : 'missing',
      anthropic: keys.anthropic ? 'configured' : 'missing',
    },
    agents,
  });
});

/**
 * GET /api/ai/agents
 * List all available coaching agents
 */
router.get('/agents', checkAIService, (req, res) => {
  const agents = listAvailableAgents();
  res.json({
    success: true,
    agents,
  });
});

/**
 * POST /api/ai/coach
 * Send a message to the AI coach
 * 
 * Body:
 * {
 *   message: "I need help with sleep",
 *   agentType?: "sleep" | "mentalHealth" | "general",
 *   stream?: false
 * }
 */
router.post('/coach', checkAIService, async (req, res) => {
  try {
    const { message, agentType, stream = false } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Build user context
    const context = await buildUserContext(userId, {
      includeProfile: true,
      includeScores: true,
      includeEntries: true,
      entriesLimit: 5,
      includeHabits: true,
    });

    // Add mood trends if available
    const moodTrends = await analyzeMoodTrends(userId, 7);
    if (moodTrends) {
      context.moodTrends = moodTrends;
    }

    // Handle streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of executeStreamingAgentRequest({
        userMessage: message,
        agentType,
        context,
      })) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Standard completion response
    const response = await executeAgentRequest({
      userMessage: message,
      agentType,
      context,
      options: {
        temperature: 0.7,
        maxTokens: 1000,
      },
    });

    res.json({
      success: true,
      agent: response.agentName,
      message: response.response,
      metadata: {
        model: response.metadata.model,
        provider: response.metadata.provider,
        tokensUsed: response.metadata.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error('AI coach error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/ai/insights
 * Get comprehensive wellness insights
 */
router.post('/insights', checkAIService, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { pillar } = req.body;

    // Build comprehensive context
    const context = await buildUserContext(userId, {
      includeProfile: true,
      includeScores: true,
      includeEntries: true,
      entriesLimit: 10,
      includeHabits: true,
    });

    // Add mood analysis
    const moodTrends = await analyzeMoodTrends(userId, 14);
    if (moodTrends) {
      context.moodTrends = moodTrends;
    }

    // Get pillar-specific activity if requested
    if (pillar) {
      const pillarActivity = await getPillarActivity(userId, pillar, 14);
      context.pillarActivity = pillarActivity;
    }

    // Execute workflow for comprehensive insights
    const workflow = [
      {
        name: 'Overall Assessment',
        agentType: 'general',
        task: pillar 
          ? `Analyze the user's progress in ${pillar}` 
          : 'Provide an overall wellness assessment',
      },
    ];

    // Add specialized agent if focusing on specific pillar
    if (pillar === 'sleep') {
      workflow.push({
        name: 'Sleep Analysis',
        agentType: 'sleep',
        task: 'Analyze sleep patterns and provide specific recommendations',
        useContext: true,
      });
    } else if (pillar === 'mental_health') {
      workflow.push({
        name: 'Mental Health Check',
        agentType: 'mentalHealth',
        task: 'Assess emotional well-being and suggest coping strategies',
        useContext: true,
      });
    }

    const result = await executeWorkflow({ workflow, context });

    res.json({
      success: true,
      insights: result.summary,
      details: result.results,
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
    });
  }
});

/**
 * POST /api/ai/daily-checkin
 * Generate personalized daily check-in
 */
router.post('/daily-checkin', checkAIService, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Build context
    const context = await buildUserContext(userId, {
      includeProfile: true,
      includeScores: true,
      includeHabits: true,
    });

    // Get current day info
    const now = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

    // Use general coach to create check-in
    const response = await executeAgentRequest({
      userMessage: `Generate a brief daily check-in message for ${dayOfWeek}`,
      agentType: 'general',
      context,
      options: {
        temperature: 0.8,
        maxTokens: 300,
      },
    });

    res.json({
      success: true,
      message: response.response,
      day: dayOfWeek,
    });
  } catch (error) {
    console.error('Daily check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily check-in',
    });
  }
});

/**
 * POST /api/ai/recommend-model
 * Get recommended AI model for a task
 */
router.post('/recommend-model', (req, res) => {
  const { taskType } = req.body;
  
  const model = getRecommendedModel(taskType);
  
  res.json({
    success: true,
    taskType,
    recommendedModel: model,
  });
});

/**
 * Example usage in your existing controllers:
 */

// In backend/controllers/entriesController.js
export async function createEntryWithAIInsights(req, res) {
  try {
    const { content, pillar, mood } = req.body;
    const userId = req.user.id;

    // Save entry first
    const entry = await Entry.create({
      userId,
      content,
      pillar,
      mood,
      date: new Date(),
    });

    // Generate AI insights asynchronously (don't wait)
    generateAIInsights(userId, entry).catch(err => 
      console.error('AI insights error:', err)
    );

    res.json({
      success: true,
      entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Helper function for async AI insights
async function generateAIInsights(userId, entry) {
  const context = await buildUserContext(userId, {
    includeScores: true,
    includeEntries: true,
    entriesLimit: 5,
  });

  // Determine which agent based on pillar
  let agentType = 'general';
  if (entry.pillar === 'sleep') agentType = 'sleep';
  if (entry.pillar === 'mental_health') agentType = 'mentalHealth';

  const response = await executeAgentRequest({
    userMessage: `Based on this journal entry, provide brief insights: "${entry.content}"`,
    agentType,
    context,
    options: { maxTokens: 300 },
  });

  // Save insights to entry
  await Entry.findByIdAndUpdate(entry._id, {
    aiInsights: response.response,
  });
}

export default router;
