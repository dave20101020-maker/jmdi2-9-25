/**
 * Agent Orchestrator
 * 
 * Routes user requests to the appropriate specialized agent
 * and coordinates multi-agent workflows.
 */

import { GeneralCoachAgent } from '../agents/generalCoachAgent.js';
import { SleepCoachAgent } from '../agents/sleepCoachAgent.js';
import { MentalHealthCoachAgent } from '../agents/mentalHealthCoachAgent.js';
import { routeCompletion, MODELS } from '../modelRouter.js';

// Initialize agents
const agents = {
  general: new GeneralCoachAgent(),
  sleep: new SleepCoachAgent(),
  mentalHealth: new MentalHealthCoachAgent(),
};

/**
 * Determine which agent should handle a user request
 */
export async function routeToAgent(userMessage, context = {}) {
  // Check for crisis first
  if (context.checkCrisis !== false) {
    const mentalHealthAgent = agents.mentalHealth;
    const crisisCheck = await mentalHealthAgent.checkForCrisis({
      message: userMessage,
      moodHistory: context.moodHistory || [],
    });

    if (crisisCheck.isCrisis) {
      return {
        agent: 'mentalHealth',
        agentName: 'Mental Health Coach',
        response: crisisCheck.message,
        metadata: {
          isCrisis: true,
          recommendation: crisisCheck.recommendation,
        },
      };
    }
  }

  // Use AI to determine the best agent
  const routingResponse = await routeCompletion({
    model: MODELS.GPT35_TURBO, // Fast model for routing
    messages: [
      {
        role: 'system',
        content: `You are a routing assistant. Analyze the user's message and determine which wellness coach should handle it.

Available coaches:
- general: General wellness, cross-pillar advice, initial questions, unclear requests
- sleep: Sleep issues, insomnia, circadian rhythm, bedroom environment, naps
- mentalHealth: Stress, anxiety, mood, emotions, cognitive patterns, mindfulness

Respond with ONLY the coach name (general, sleep, or mentalHealth). Nothing else.`,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    temperature: 0.3,
    maxTokens: 20,
  });

  const agentChoice = routingResponse.content.trim().toLowerCase();
  
  // Validate agent choice
  const validAgents = ['general', 'sleep', 'mentalhealth'];
  const selectedAgent = validAgents.includes(agentChoice) ? agentChoice : 'general';

  return {
    agent: selectedAgent,
    agentName: getAgentDisplayName(selectedAgent),
    confidence: agentChoice === selectedAgent ? 'high' : 'low',
  };
}

/**
 * Execute a request with the appropriate agent
 */
export async function executeAgentRequest({
  userMessage,
  agentType = null,
  context = {},
  options = {},
}) {
  try {
    // Route to agent if not specified
    let selectedAgent = agentType;
    let routing = null;

    if (!selectedAgent) {
      routing = await routeToAgent(userMessage, context);
      selectedAgent = routing.agent;

      // If crisis detected, return immediately
      if (routing.metadata?.isCrisis) {
        return routing;
      }
    }

    // Get the agent instance
    const agent = agents[selectedAgent];
    if (!agent) {
      throw new Error(`Unknown agent type: ${selectedAgent}`);
    }

    // Execute request
    const response = await agent.process({
      userMessage,
      context,
      options,
    });

    return {
      agent: selectedAgent,
      agentName: getAgentDisplayName(selectedAgent),
      response: response.content,
      metadata: {
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        routing: routing,
      },
    };
  } catch (error) {
    console.error('Agent orchestration error:', error);
    throw new Error(`Failed to execute agent request: ${error.message}`);
  }
}

/**
 * Execute a streaming request with the appropriate agent
 */
export async function* executeStreamingAgentRequest({
  userMessage,
  agentType = null,
  context = {},
  options = {},
}) {
  try {
    // Route to agent if not specified
    let selectedAgent = agentType;
    if (!selectedAgent) {
      const routing = await routeToAgent(userMessage, context);
      selectedAgent = routing.agent;

      // If crisis detected, yield response and return
      if (routing.metadata?.isCrisis) {
        yield routing;
        return;
      }
    }

    // Get the agent instance
    const agent = agents[selectedAgent];
    if (!agent) {
      throw new Error(`Unknown agent type: ${selectedAgent}`);
    }

    // Stream response
    for await (const chunk of agent.processStream({
      userMessage,
      context,
      options,
    })) {
      yield {
        agent: selectedAgent,
        agentName: getAgentDisplayName(selectedAgent),
        ...chunk,
      };
    }
  } catch (error) {
    console.error('Streaming orchestration error:', error);
    throw new Error(`Failed to stream agent request: ${error.message}`);
  }
}

/**
 * Execute a multi-step workflow with multiple agents
 */
export async function executeWorkflow({ workflow, context = {} }) {
  const results = [];

  for (const step of workflow) {
    const { agentType, task, useContext } = step;

    // Build context for this step
    const stepContext = {
      ...context,
      previousResults: useContext ? results : undefined,
    };

    // Execute step
    const result = await executeAgentRequest({
      userMessage: task,
      agentType,
      context: stepContext,
      options: step.options || {},
    });

    results.push({
      step: step.name || `Step ${results.length + 1}`,
      agent: result.agent,
      response: result.response,
      metadata: result.metadata,
    });
  }

  return {
    workflow: workflow.map(s => s.name || 'Unnamed step'),
    results,
    summary: await synthesizeWorkflowResults(results),
  };
}

/**
 * Synthesize results from multiple agents
 */
async function synthesizeWorkflowResults(results) {
  if (results.length === 1) {
    return results[0].response;
  }

  const synthesisPrompt = `Synthesize these insights from multiple wellness coaches into a coherent, actionable summary:

${results.map((r, i) => `${i + 1}. ${r.agent.toUpperCase()} COACH:\n${r.response}\n`).join('\n')}

Create a unified response that:
- Integrates the key insights from each coach
- Highlights connections between different wellness areas
- Provides 2-3 prioritized action items
- Maintains an encouraging, supportive tone

Keep it concise (2-3 paragraphs).`;

  const synthesis = await routeCompletion({
    model: MODELS.GPT4_TURBO,
    messages: [
      {
        role: 'system',
        content: 'You are a wellness synthesis expert. Integrate multiple coaching perspectives into actionable guidance.',
      },
      {
        role: 'user',
        content: synthesisPrompt,
      },
    ],
    temperature: 0.7,
    maxTokens: 500,
  });

  return synthesis.content;
}

/**
 * Get agent display name
 */
function getAgentDisplayName(agentType) {
  const names = {
    general: 'General Wellness Coach',
    sleep: 'Sleep Coach',
    mentalHealth: 'Mental Health Coach',
  };
  return names[agentType] || 'Coach';
}

/**
 * List available agents
 */
export function listAvailableAgents() {
  return Object.keys(agents).map(key => ({
    id: key,
    name: getAgentDisplayName(key),
    specialty: agents[key].specialty,
  }));
}

export { agents };
