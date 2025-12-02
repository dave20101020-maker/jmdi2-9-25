/**
 * Agent Base Usage Examples
 * 
 * This file demonstrates how to use agentBase.js utilities
 * when building specialized coaching agents.
 */

import {
  buildMessageHistory,
  getPillarDisplayName,
  validateAgentContext,
  createMinimalContext,
} from './agentBase.js';

/**
 * Example 1: Basic usage with minimal context
 */
function exampleBasicUsage() {
  console.log('\n=== Example 1: Basic Usage ===');

  // Create a simple context
  const context = createMinimalContext('user123', 'sleep');

  // Define an agent's system prompt
  const agentSystemPrompt = `You are a sleep coach specializing in circadian rhythm optimization.
Provide evidence-based advice on sleep hygiene, bedroom environment, and sleep schedules.
Keep responses encouraging and actionable.`;

  // Build message history
  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt,
  });

  console.log('System Prompt Length:', systemPrompt.length);
  console.log('Conversation History:', conversationHistory.length, 'messages');
  console.log('\nFirst 200 chars of system prompt:');
  console.log(systemPrompt.substring(0, 200) + '...');
}

/**
 * Example 2: With conversation history
 */
function exampleWithConversationHistory() {
  console.log('\n=== Example 2: With Conversation History ===');

  const context = {
    userId: 'user456',
    pillar: 'mental_health',
  };

  const agentSystemPrompt = `You are a mental health coach trained in CBT techniques.
Help users identify negative thought patterns and reframe them constructively.`;

  const lastMessages = [
    { role: 'user', content: 'I feel anxious about tomorrow.' },
    { role: 'assistant', content: 'What specifically about tomorrow worries you?' },
    { role: 'user', content: 'I have a big presentation at work.' },
    { role: 'assistant', content: 'Presentations can be nerve-wracking. Have you prepared?' },
    { role: 'user', content: 'Yes, but I worry I\'ll forget what to say.' },
    { role: 'assistant', content: 'That\'s a common fear. Let\'s work on some grounding techniques.' },
    { role: 'user', content: 'Okay, what should I do?' },
  ];

  const result = buildMessageHistory({
    context,
    agentSystemPrompt,
    lastMessages,
  });

  console.log('Conversation History (last 5 messages):');
  result.conversationHistory.forEach((msg, i) => {
    console.log(`  ${i + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
  });
}

/**
 * Example 3: With memory and app items
 */
function exampleWithMemoryAndAppItems() {
  console.log('\n=== Example 3: With Memory and App Items ===');

  const context = {
    userId: 'user789',
    pillar: 'nutrition',
    memory: {
      dietaryRestrictions: ['vegetarian', 'gluten-free'],
      goals: ['lose 10 pounds', 'increase energy'],
      preferences: 'likes Mediterranean cuisine',
    },
    appItems: {
      recentMeals: [
        { date: '2025-12-01', meal: 'Quinoa salad with chickpeas' },
        { date: '2025-12-01', meal: 'Vegetable stir-fry' },
      ],
      activeGoals: [
        { name: 'Eat 5 servings of vegetables daily', progress: 60 },
      ],
    },
  };

  const agentSystemPrompt = `You are a nutrition coach specializing in plant-based diets.
Create meal plans that respect dietary restrictions while meeting nutritional needs.`;

  const extraSystemNotes = `User has been consistent with vegetable intake this week.
Consider suggesting protein-rich plant-based options.`;

  const result = buildMessageHistory({
    context,
    agentSystemPrompt,
    extraSystemNotes,
  });

  console.log('System prompt includes:');
  console.log('  - NorthStar context: ✓');
  console.log('  - User memory:', result.systemPrompt.includes('dietary') ? '✓' : '✗');
  console.log('  - App items:', result.systemPrompt.includes('recentMeals') ? '✓' : '✗');
  console.log('  - Agent instructions: ✓');
  console.log('  - Extra notes:', result.systemPrompt.includes('protein-rich') ? '✓' : '✗');
}

/**
 * Example 4: Using helper functions
 */
function exampleHelperFunctions() {
  console.log('\n=== Example 4: Helper Functions ===');

  // Get display names
  const pillars = ['sleep', 'mental_health', 'nutrition', 'exercise'];
  console.log('Pillar Display Names:');
  pillars.forEach(pillar => {
    console.log(`  ${pillar} → ${getPillarDisplayName(pillar)}`);
  });

  // Validate context
  try {
    validateAgentContext({
      userId: 'user123',
      pillar: 'sleep',
    });
    console.log('\n✓ Valid context passed validation');
  } catch (error) {
    console.log('\n✗ Context validation failed:', error.message);
  }

  // Test invalid context
  try {
    validateAgentContext({
      userId: 'user123',
      pillar: 'invalid_pillar',
    });
  } catch (error) {
    console.log('✓ Invalid pillar correctly rejected:', error.message);
  }
}

/**
 * Example 5: Integration with model router
 */
async function exampleWithModelRouter() {
  console.log('\n=== Example 5: Integration with Model Router ===');

  // Import would normally be: import { runWithBestModel } from '../modelRouter.js';
  // For this example, we'll simulate the pattern

  const context = createMinimalContext('user999', 'sleep');

  const agentSystemPrompt = `You are a sleep optimization expert.
Analyze sleep patterns and provide actionable recommendations.`;

  const lastMessages = [
    { role: 'user', content: 'I wake up multiple times during the night.' },
  ];

  const { systemPrompt, conversationHistory } = buildMessageHistory({
    context,
    agentSystemPrompt,
    lastMessages,
  });

  console.log('Ready to call model router:');
  console.log('  taskType: "deep_reasoning"');
  console.log('  systemPrompt: [', systemPrompt.split('\n').length, 'lines ]');
  console.log('  conversationHistory: [', conversationHistory.length, 'messages ]');
  console.log('  userMessage: "What could be causing this?"');

  /*
  // Actual call would look like:
  const result = await runWithBestModel({
    taskType: 'deep_reasoning',
    systemPrompt,
    userMessage: 'What could be causing this?',
    conversationHistory,
  });
  
  console.log('AI Response:', result.text);
  */
}

/**
 * Example 6: Error handling
 */
function exampleErrorHandling() {
  console.log('\n=== Example 6: Error Handling ===');

  // Missing context
  try {
    buildMessageHistory({
      agentSystemPrompt: 'Test prompt',
    });
  } catch (error) {
    console.log('✓ Caught error - missing context:', error.message);
  }

  // Missing agentSystemPrompt
  try {
    buildMessageHistory({
      context: { userId: 'user123', pillar: 'sleep' },
    });
  } catch (error) {
    console.log('✓ Caught error - missing prompt:', error.message);
  }

  // Invalid pillar
  try {
    validateAgentContext({
      userId: 'user123',
      pillar: 'invalid',
    });
  } catch (error) {
    console.log('✓ Caught error - invalid pillar:', error.message.substring(0, 50) + '...');
  }
}

/**
 * Run all examples
 */
function runAllExamples() {
  console.log('='.repeat(60));
  console.log('Agent Base Usage Examples');
  console.log('='.repeat(60));

  exampleBasicUsage();
  exampleWithConversationHistory();
  exampleWithMemoryAndAppItems();
  exampleHelperFunctions();
  exampleWithModelRouter();
  exampleErrorHandling();

  console.log('\n' + '='.repeat(60));
  console.log('All examples complete!');
  console.log('='.repeat(60));
}

// Export examples for testing
export {
  exampleBasicUsage,
  exampleWithConversationHistory,
  exampleWithMemoryAndAppItems,
  exampleHelperFunctions,
  exampleWithModelRouter,
  exampleErrorHandling,
  runAllExamples,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
