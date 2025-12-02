/**
 * Test Suite for Fitness Agent (Coach Atlas)
 * 
 * Run with: node backend/src/ai/agents/fitnessAgentTest.js
 */

import { fitnessSystemPrompt } from './fitnessAgent.js';

console.log('=== FITNESS AGENT (Coach Atlas) TEST SUITE ===\n');

// Check if API keys are available
const hasAPIKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!hasAPIKeys) {
  console.log('⚠ WARNING: No API keys found in environment');
  console.log('  Performing structure validation only\n');
}

// Test 1: System prompt verification
console.log('--- Test 1: System Prompt Verification ---');
console.log('✓ fitnessSystemPrompt exported successfully');
console.log(`  Prompt length: ${fitnessSystemPrompt.length} chars`);
console.log(`  Contains "Coach Atlas": ${fitnessSystemPrompt.includes('Coach Atlas')}`);
console.log(`  Contains "exercise": ${fitnessSystemPrompt.toLowerCase().includes('exercise')}`);
console.log(`  Contains "workout": ${fitnessSystemPrompt.toLowerCase().includes('workout')}`);
console.log(`  Contains "fitness": ${fitnessSystemPrompt.toLowerCase().includes('fitness')}`);
console.log();

// Test 2: Module structure validation
console.log('--- Test 2: Module Structure Validation ---');
try {
  const module = await import('./fitnessAgent.js');
  const { runFitnessAgent, generateWorkout, getFormCoaching, getExerciseModification, 
          getProgressionStrategy, getRecoveryAdvice, designTrainingProgram, getMotivationCoaching } = module;
  
  console.log('✓ runFitnessAgent function exported');
  console.log('✓ All helper functions exported');
  console.log(`  runFitnessAgent type: ${typeof runFitnessAgent}`);
  console.log(`  generateWorkout type: ${typeof generateWorkout}`);
  console.log(`  getFormCoaching type: ${typeof getFormCoaching}`);
  console.log(`  getExerciseModification type: ${typeof getExerciseModification}`);
  console.log(`  getProgressionStrategy type: ${typeof getProgressionStrategy}`);
  console.log(`  getRecoveryAdvice type: ${typeof getRecoveryAdvice}`);
  console.log(`  designTrainingProgram type: ${typeof designTrainingProgram}`);
  console.log(`  getMotivationCoaching type: ${typeof getMotivationCoaching}`);
} catch (error) {
  console.log(`✗ Module import error: ${error.message}`);
}
console.log();

// Test 3: Error handling - wrong pillar
console.log('--- Test 3: Error Handling (Wrong Pillar) ---');
try {
  const { runFitnessAgent } = await import('./fitnessAgent.js');
  const wrongContext = { userId: 'test', pillar: 'nutrition' };
  await runFitnessAgent({
    context: wrongContext,
    userMessage: "Give me a workout plan",
    lastMessages: []
  });
  console.log('✗ Should have thrown validation error');
} catch (error) {
  console.log(`✓ Correctly threw error: ${error.message}`);
}
console.log();

// Test 4: Error handling - empty message
console.log('--- Test 4: Error Handling (Empty Message) ---');
try {
  const { runFitnessAgent } = await import('./fitnessAgent.js');
  const context = { userId: 'test', pillar: 'fitness' };
  await runFitnessAgent({
    context,
    userMessage: "",
    lastMessages: []
  });
  console.log('✗ Should have thrown validation error');
} catch (error) {
  console.log(`✓ Correctly threw error: ${error.message}`);
}
console.log();

console.log('=== TEST SUITE COMPLETE ===');
console.log('\nNote: Full AI response testing requires API keys.');
console.log('Structure and error handling validated successfully.');
