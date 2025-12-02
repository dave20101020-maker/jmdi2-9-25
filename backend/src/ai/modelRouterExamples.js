/**
 * Model Router Usage Examples
 * 
 * This file demonstrates how to use the runWithBestModel function
 * for different task types.
 */

import { runWithBestModel, checkAPIKeys } from './modelRouter.js';

/**
 * Example 1: Deep Reasoning Task
 * Uses Claude (Anthropic) for complex analytical thinking
 */
async function exampleDeepReasoning() {
  console.log('\n=== Example 1: Deep Reasoning ===');
  
  const result = await runWithBestModel({
    taskType: 'deep_reasoning',
    systemPrompt: 'You are a wellness analyst. Provide deep, thoughtful analysis.',
    userMessage: 'Analyze the connection between sleep quality and mental health, considering circadian rhythms, cortisol levels, and neuroplasticity.',
    conversationHistory: [],
  });

  console.log(`Model used: ${result.model}`);
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 2: Emotional Coaching Task
 * Uses OpenAI ChatGPT for empathetic, conversational support
 */
async function exampleEmotionalCoaching() {
  console.log('\n=== Example 2: Emotional Coaching ===');
  
  const result = await runWithBestModel({
    taskType: 'emotional_coaching',
    systemPrompt: 'You are an empathetic wellness coach. Provide warm, supportive guidance.',
    userMessage: "I've been feeling really overwhelmed lately with work stress. How can I manage this better?",
    conversationHistory: [],
  });

  console.log(`Model used: ${result.model}`);
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 3: Mixed Task with Conversation History
 * Uses Claude by default, with automatic fallback to OpenAI if needed
 */
async function exampleMixedWithHistory() {
  console.log('\n=== Example 3: Mixed Task with Conversation History ===');
  
  const result = await runWithBestModel({
    taskType: 'mixed',
    systemPrompt: 'You are a holistic wellness coach specializing in sleep and stress.',
    userMessage: 'Based on what we discussed, what specific steps should I take this week?',
    conversationHistory: [
      {
        role: 'user',
        content: 'I have trouble sleeping and feel anxious during the day.',
      },
      {
        role: 'assistant',
        content: 'It sounds like your sleep issues and anxiety might be connected. Poor sleep can increase cortisol levels, making you more prone to anxiety during the day.',
      },
    ],
  });

  console.log(`Model used: ${result.model}`);
  console.log(`Response: ${result.text.substring(0, 200)}...`);
}

/**
 * Example 4: Error Handling
 * Demonstrates automatic fallback when primary model fails
 */
async function exampleErrorHandling() {
  console.log('\n=== Example 4: Error Handling ===');
  
  try {
    const result = await runWithBestModel({
      taskType: 'deep_reasoning',
      systemPrompt: 'You are a helpful assistant.',
      userMessage: 'What is cognitive behavioral therapy?',
    });
    
    console.log(`Success! Model used: ${result.model}`);
    console.log(`Response: ${result.text.substring(0, 100)}...`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

/**
 * Example 5: Quick Wellness Check-In
 * Simple conversational task
 */
async function exampleWellnessCheckIn() {
  console.log('\n=== Example 5: Quick Wellness Check-In ===');
  
  const result = await runWithBestModel({
    taskType: 'emotional_coaching',
    systemPrompt: 'You are a friendly wellness coach. Keep responses brief and encouraging.',
    userMessage: 'I completed all my healthy habits today!',
  });

  console.log(`Model used: ${result.model}`);
  console.log(`Response: ${result.text}`);
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('='.repeat(50));
  console.log('Model Router Usage Examples');
  console.log('='.repeat(50));

  // Check if API keys are configured
  const keys = checkAPIKeys();
  console.log('\nAPI Keys Status:');
  console.log(`  OpenAI: ${keys.openai ? '✓ Configured' : '✗ Missing'}`);
  console.log(`  Anthropic: ${keys.anthropic ? '✓ Configured' : '✗ Missing'}`);

  if (!keys.openai && !keys.anthropic) {
    console.error('\n❌ No API keys configured! Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file.');
    return;
  }

  // Run examples
  try {
    await exampleDeepReasoning();
    await exampleEmotionalCoaching();
    await exampleMixedWithHistory();
    await exampleErrorHandling();
    await exampleWellnessCheckIn();
  } catch (error) {
    console.error('\nExample failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Examples complete!');
  console.log('='.repeat(50));
}

// Export examples for testing
export {
  exampleDeepReasoning,
  exampleEmotionalCoaching,
  exampleMixedWithHistory,
  exampleErrorHandling,
  exampleWellnessCheckIn,
  runExamples,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
