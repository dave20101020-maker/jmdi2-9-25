/**
 * Sleep Agent Test & Examples
 * 
 * Demonstrates how to use the Sleep Agent (Dr. Luna) for various scenarios.
 */

import {
  runSleepAgent,
  quickSleepAssessment,
  generateBedtimeRoutine,
  getSleepHygieneTips,
  sleepSystemPrompt,
} from './sleepAgent.js';
import { createMinimalContext } from './agentBase.js';
import { checkAPIKeys } from '../modelRouter.js';

/**
 * Example 1: Basic sleep coaching interaction
 */
async function exampleBasicSleepCoaching() {
  console.log('\n=== Example 1: Basic Sleep Coaching ===');

  const context = createMinimalContext('user123', 'sleep');

  const result = await runSleepAgent({
    context,
    userMessage: "I've been having trouble falling asleep lately. What can I do?",
    lastMessages: [],
  });

  console.log(`Agent: ${result.meta.agentName}`);
  console.log(`Model: ${result.model}`);
  console.log(`Task Type: ${result.meta.taskType}`);
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 2: Sleep assessment request (deep reasoning)
 */
async function exampleSleepAssessment() {
  console.log('\n=== Example 2: Sleep Assessment (Deep Reasoning) ===');

  const context = {
    userId: 'user456',
    pillar: 'sleep',
    memory: {
      sleepGoal: 8,
      currentAverage: 6.5,
      issueReported: 'difficulty falling asleep',
    },
    appItems: {
      recentSleepLog: [
        { date: '2025-12-01', hoursSlept: 6.5, quality: 'fair' },
        { date: '2025-11-30', hoursSlept: 6, quality: 'poor' },
        { date: '2025-11-29', hoursSlept: 7, quality: 'good' },
      ],
    },
  };

  const result = await runSleepAgent({
    context,
    userMessage: 'Can you assess my sleep pattern and create an improvement plan?',
  });

  console.log(`Task Type: ${result.meta.taskType}`);
  console.log(`Model Used: ${result.model}`);
  console.log(`Response Length: ${result.text.length} characters`);
  console.log(`First 150 chars: ${result.text.substring(0, 150)}...`);
}

/**
 * Example 3: Emotional support (anxious about sleep)
 */
async function exampleEmotionalSupport() {
  console.log('\n=== Example 3: Emotional Support ===');

  const context = createMinimalContext('user789', 'sleep');

  const result = await runSleepAgent({
    context,
    userMessage: "I'm so anxious about not getting enough sleep tonight. I can't stop worrying.",
  });

  console.log(`Task Type: ${result.meta.taskType}`); // Should be 'emotional_coaching'
  console.log(`Model: ${result.model}`);
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 4: Conversation with history
 */
async function exampleConversationWithHistory() {
  console.log('\n=== Example 4: Conversation with History ===');

  const context = createMinimalContext('user999', 'sleep');

  const conversationHistory = [
    {
      role: 'user',
      content: 'I wake up multiple times during the night.',
    },
    {
      role: 'assistant',
      content: 'That sounds frustrating. How many times do you typically wake up, and can you fall back asleep easily?',
    },
    {
      role: 'user',
      content: '3-4 times, and it takes me 20-30 minutes to fall back asleep.',
    },
    {
      role: 'assistant',
      content: 'That\'s quite disruptive. Do you notice any patterns? Are there specific times, or anything that might be waking you?',
    },
  ];

  const result = await runSleepAgent({
    context,
    userMessage: 'Usually around 2 AM and 4 AM. Sometimes I need to use the bathroom.',
    lastMessages: conversationHistory,
  });

  console.log(`Conversation turns in history: ${conversationHistory.length}`);
  console.log(`Task Type: ${result.meta.taskType}`);
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 5: Quick sleep assessment helper
 */
async function exampleQuickAssessment() {
  console.log('\n=== Example 5: Quick Sleep Assessment ===');

  const context = {
    userId: 'user555',
    pillar: 'sleep',
    appItems: {
      recentHabits: [
        { name: 'No caffeine after 2 PM', streak: 7 },
        { name: 'Bedroom dark and cool', streak: 14 },
      ],
      sleepScore: 65,
    },
  };

  const result = await quickSleepAssessment(context);

  console.log(`Agent: ${result.meta.agentName}`);
  console.log(`Assessment: ${result.text.substring(0, 250)}...`);
}

/**
 * Example 6: Generate bedtime routine
 */
async function exampleBedtimeRoutine() {
  console.log('\n=== Example 6: Generate Bedtime Routine ===');

  const context = {
    userId: 'user666',
    pillar: 'sleep',
    memory: {
      lifestyle: 'desk job, high stress',
      preferences: 'likes reading, no TV',
    },
  };

  const result = await generateBedtimeRoutine(context, {
    wakeTime: '6:30 AM',
    sleepGoalHours: 8,
  });

  console.log(`Task Type: ${result.meta.taskType}`);
  console.log(`Routine: ${result.text.substring(0, 300)}...`);
}

/**
 * Example 7: Get sleep hygiene tips
 */
async function exampleSleepHygieneTips() {
  console.log('\n=== Example 7: Sleep Hygiene Tips ===');

  const context = createMinimalContext('user777', 'sleep');

  const result = await getSleepHygieneTips(context, 'technology');

  console.log(`Focus Area: technology`);
  console.log(`Tips: ${result.text.substring(0, 250)}...`);
}

/**
 * Example 8: Error handling
 */
async function exampleErrorHandling() {
  console.log('\n=== Example 8: Error Handling ===');

  // Test with wrong pillar
  try {
    const wrongContext = createMinimalContext('user888', 'nutrition');
    await runSleepAgent({
      context: wrongContext,
      userMessage: 'Help me sleep better',
    });
  } catch (error) {
    console.log('✓ Caught error - wrong pillar:', error.message);
  }

  // Test with empty message
  try {
    const context = createMinimalContext('user888', 'sleep');
    await runSleepAgent({
      context,
      userMessage: '',
    });
  } catch (error) {
    console.log('✓ Caught error - empty message:', error.message);
  }
}

/**
 * Example 9: Check system prompt
 */
function exampleSystemPrompt() {
  console.log('\n=== Example 9: System Prompt ===');
  console.log(`System Prompt Length: ${sleepSystemPrompt.length} characters`);
  console.log(`Lines: ${sleepSystemPrompt.split('\n').length}`);
  console.log(`\nFirst 200 characters:`);
  console.log(sleepSystemPrompt.substring(0, 200) + '...');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('='.repeat(70));
  console.log('Sleep Agent (Dr. Luna) - Test & Examples');
  console.log('='.repeat(70));

  // Check API keys first
  const keys = checkAPIKeys();
  console.log('\nAPI Keys Status:');
  console.log(`  OpenAI: ${keys.openai ? '✓ Configured' : '✗ Missing'}`);
  console.log(`  Anthropic: ${keys.anthropic ? '✓ Configured' : '✗ Missing'}`);

  if (!keys.openai && !keys.anthropic) {
    console.error('\n❌ No API keys configured! Skipping live examples.');
    console.error('Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env file.');
    exampleSystemPrompt();
    return;
  }

  // Run examples that don't require API calls first
  exampleSystemPrompt();

  console.log('\n' + '='.repeat(70));
  console.log('Running live examples (requires API keys)...');
  console.log('='.repeat(70));

  try {
    await exampleBasicSleepCoaching();
    await exampleSleepAssessment();
    await exampleEmotionalSupport();
    await exampleConversationWithHistory();
    await exampleQuickAssessment();
    await exampleBedtimeRoutine();
    await exampleSleepHygieneTips();
    await exampleErrorHandling();

    console.log('\n' + '='.repeat(70));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Export examples for individual testing
export {
  exampleBasicSleepCoaching,
  exampleSleepAssessment,
  exampleEmotionalSupport,
  exampleConversationWithHistory,
  exampleQuickAssessment,
  exampleBedtimeRoutine,
  exampleSleepHygieneTips,
  exampleErrorHandling,
  exampleSystemPrompt,
  runAllExamples,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
