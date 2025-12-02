/**
 * Mental Health Agent Test & Examples
 * 
 * Demonstrates how to use the Mental Health Agent (Dr. Serenity) for various scenarios.
 */

import {
  runMentalHealthAgent,
  quickMentalHealthCheckIn,
  runGAD7Screening,
  runPHQ9Screening,
  getStressManagementTechniques,
  guideCognitiveReframing,
  getGroundingTechnique,
  detectCrisisKeywords,
  mentalHealthSystemPrompt,
} from './mentalHealthAgent.js';
import { createMinimalContext } from './agentBase.js';
import { checkAPIKeys } from '../modelRouter.js';

/**
 * Example 1: Basic emotional support
 */
async function exampleEmotionalSupport() {
  console.log('\n=== Example 1: Basic Emotional Support ===');

  const context = createMinimalContext('user123', 'mental_health');

  const result = await runMentalHealthAgent({
    context,
    userMessage: "I'm feeling really anxious about work tomorrow. My mind won't stop racing.",
    lastMessages: [],
  });

  console.log(`Agent: ${result.meta.agentName}`);
  console.log(`Model: ${result.model}`);
  console.log(`Task Type: ${result.meta.taskType}`); // Should be 'emotional_coaching'
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 2: GAD-7 screening (deep reasoning)
 */
async function exampleGAD7Screening() {
  console.log('\n=== Example 2: GAD-7 Anxiety Screening ===');

  const context = {
    userId: 'user456',
    pillar: 'mental_health',
    memory: {
      anxietyReported: true,
      symptoms: ['racing thoughts', 'difficulty concentrating', 'restlessness'],
    },
    appItems: {
      recentMoodLog: [
        { date: '2025-12-01', mood: 'anxious', intensity: 7 },
        { date: '2025-11-30', mood: 'worried', intensity: 6 },
        { date: '2025-11-29', mood: 'stressed', intensity: 8 },
      ],
    },
  };

  const result = await runMentalHealthAgent({
    context,
    userMessage: 'Can you help me complete the GAD-7 screening for anxiety?',
  });

  console.log(`Task Type: ${result.meta.taskType}`); // Should be 'deep_reasoning'
  console.log(`Model Used: ${result.model}`);
  console.log(`Response Length: ${result.text.length} characters`);
  console.log(`First 150 chars: ${result.text.substring(0, 150)}...`);
}

/**
 * Example 3: Cognitive reframing with conversation history
 */
async function exampleCognitiveReframing() {
  console.log('\n=== Example 3: Cognitive Reframing ===');

  const context = createMinimalContext('user789', 'mental_health');

  const conversationHistory = [
    {
      role: 'user',
      content: 'I made a mistake at work today and I feel terrible.',
    },
    {
      role: 'assistant',
      content: 'I hear you. Mistakes can feel overwhelming in the moment. What happened?',
    },
    {
      role: 'user',
      content: 'I sent an email to the wrong person. Now I think everyone thinks I\'m incompetent.',
    },
  ];

  const result = await runMentalHealthAgent({
    context,
    userMessage: 'I keep thinking "I\'m such a failure, I always mess everything up."',
    lastMessages: conversationHistory,
  });

  console.log(`Task Type: ${result.meta.taskType}`);
  console.log(`Conversation turns: ${conversationHistory.length}`);
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 4: Crisis detection
 */
async function exampleCrisisDetection() {
  console.log('\n=== Example 4: Crisis Detection ===');

  const crisisMessages = [
    "I've been feeling really down lately",
    "I'm thinking about suicide",
    "I want to hurt myself",
  ];

  crisisMessages.forEach(msg => {
    const isCrisis = detectCrisisKeywords(msg);
    console.log(`Message: "${msg}"`);
    console.log(`Crisis detected: ${isCrisis ? '⚠️  YES - IMMEDIATE INTERVENTION' : '✓ No'}\n`);
  });
}

/**
 * Example 5: Quick mental health check-in
 */
async function exampleQuickCheckIn() {
  console.log('\n=== Example 5: Quick Mental Health Check-In ===');

  const context = {
    userId: 'user555',
    pillar: 'mental_health',
    appItems: {
      recentJournalEntries: [
        { date: '2025-12-01', content: 'Felt overwhelmed at work', mood: 'stressed' },
        { date: '2025-11-30', content: 'Better day, got some exercise', mood: 'okay' },
        { date: '2025-11-29', content: 'Anxious about upcoming deadline', mood: 'anxious' },
      ],
      moodAverage: 5.2,
    },
  };

  const result = await quickMentalHealthCheckIn(context);

  console.log(`Agent: ${result.meta.agentName}`);
  console.log(`Check-in: ${result.text.substring(0, 250)}...`);
}

/**
 * Example 6: Stress management techniques
 */
async function exampleStressManagement() {
  console.log('\n=== Example 6: Stress Management Techniques ===');

  const context = {
    userId: 'user666',
    pillar: 'mental_health',
    memory: {
      stressors: ['work deadlines', 'financial concerns'],
      copingSkills: ['exercise', 'talking to friends'],
    },
  };

  const result = await getStressManagementTechniques(context, 'work');

  console.log(`Focus Area: work stress`);
  console.log(`Techniques: ${result.text.substring(0, 300)}...`);
}

/**
 * Example 7: Grounding technique for acute anxiety
 */
async function exampleGroundingTechnique() {
  console.log('\n=== Example 7: Grounding Technique ===');

  const context = createMinimalContext('user777', 'mental_health');

  const result = await getGroundingTechnique(context, 8);

  console.log(`Anxiety Level: 8/10`);
  console.log(`Grounding Technique: ${result.text.substring(0, 250)}...`);
}

/**
 * Example 8: PHQ-9 depression screening
 */
async function examplePHQ9Screening() {
  console.log('\n=== Example 8: PHQ-9 Depression Screening ===');

  const context = {
    userId: 'user888',
    pillar: 'mental_health',
    memory: {
      symptoms: ['low energy', 'sleep problems', 'loss of interest'],
      duration: '3 weeks',
    },
  };

  const result = await runPHQ9Screening(context);

  console.log(`Task Type: ${result.meta.taskType}`); // Should be 'deep_reasoning'
  console.log(`Screening: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 9: Error handling
 */
async function exampleErrorHandling() {
  console.log('\n=== Example 9: Error Handling ===');

  // Test with wrong pillar
  try {
    const wrongContext = createMinimalContext('user999', 'sleep');
    await runMentalHealthAgent({
      context: wrongContext,
      userMessage: 'I feel anxious',
    });
  } catch (error) {
    console.log('✓ Caught error - wrong pillar:', error.message);
  }

  // Test with empty message
  try {
    const context = createMinimalContext('user999', 'mental_health');
    await runMentalHealthAgent({
      context,
      userMessage: '   ',
    });
  } catch (error) {
    console.log('✓ Caught error - empty message:', error.message);
  }
}

/**
 * Example 10: Check system prompt
 */
function exampleSystemPrompt() {
  console.log('\n=== Example 10: System Prompt ===');
  console.log(`System Prompt Length: ${mentalHealthSystemPrompt.length} characters`);
  console.log(`Lines: ${mentalHealthSystemPrompt.split('\n').length}`);
  console.log(`\nFirst 200 characters:`);
  console.log(mentalHealthSystemPrompt.substring(0, 200) + '...');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('='.repeat(70));
  console.log('Mental Health Agent (Dr. Serenity) - Test & Examples');
  console.log('='.repeat(70));

  // Check API keys first
  const keys = checkAPIKeys();
  console.log('\nAPI Keys Status:');
  console.log(`  OpenAI: ${keys.openai ? '✓ Configured' : '✗ Missing'}`);
  console.log(`  Anthropic: ${keys.anthropic ? '✓ Configured' : '✗ Missing'}`);

  // Run examples that don't require API calls first
  exampleSystemPrompt();
  await exampleCrisisDetection();

  if (!keys.openai && !keys.anthropic) {
    console.error('\n❌ No API keys configured! Skipping live examples.');
    console.error('Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env file.');
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log('Running live examples (requires API keys)...');
  console.log('='.repeat(70));

  try {
    await exampleEmotionalSupport();
    await exampleGAD7Screening();
    await exampleCognitiveReframing();
    await exampleQuickCheckIn();
    await exampleStressManagement();
    await exampleGroundingTechnique();
    await examplePHQ9Screening();
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
  exampleEmotionalSupport,
  exampleGAD7Screening,
  exampleCognitiveReframing,
  exampleCrisisDetection,
  exampleQuickCheckIn,
  exampleStressManagement,
  exampleGroundingTechnique,
  examplePHQ9Screening,
  exampleErrorHandling,
  exampleSystemPrompt,
  runAllExamples,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
