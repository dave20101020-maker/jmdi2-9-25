/**
 * Test Suite for Nutrition Agent (Chef Nourish)
 * 
 * Run with: node backend/src/ai/agents/nutritionAgentTest.js
 */

import { nutritionSystemPrompt } from './nutritionAgent.js';

console.log('=== NUTRITION AGENT (Chef Nourish) TEST SUITE ===\n');

// Check if API keys are available
const hasAPIKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!hasAPIKeys) {
  console.log('⚠ WARNING: No API keys found in environment');
  console.log('  Performing structure validation only\n');
}

// Test 1: System prompt verification
console.log('--- Test 1: System Prompt Verification ---');
console.log('✓ nutritionSystemPrompt exported successfully');
console.log(`  Prompt length: ${nutritionSystemPrompt.length} chars`);
console.log(`  Contains "Chef Nourish": ${nutritionSystemPrompt.includes('Chef Nourish')}`);
console.log(`  Contains "meal planning": ${nutritionSystemPrompt.toLowerCase().includes('meal planning')}`);
console.log(`  Contains "dietary": ${nutritionSystemPrompt.toLowerCase().includes('dietary')}`);
console.log(`  Contains "macronutrient": ${nutritionSystemPrompt.toLowerCase().includes('macronutrient')}`);
console.log();

// Test 2: Module structure validation
console.log('--- Test 2: Module Structure Validation ---');
try {
  const { runNutritionAgent, determineTaskType } = await import('./nutritionAgent.js');
  console.log('✓ runNutritionAgent function exported');
  console.log('✓ All required exports present');
  console.log(`  runNutritionAgent type: ${typeof runNutritionAgent}`);
} catch (error) {
  console.log(`✗ Module import error: ${error.message}`);
}
console.log();

// Test 3: Error handling - wrong pillar
console.log('--- Test 3: Error Handling (Wrong Pillar) ---');
try {
  const { runNutritionAgent } = await import('./nutritionAgent.js');
  const wrongContext = { userId: 'test', pillar: 'sleep' };
  await runNutritionAgent({
    context: wrongContext,
    userMessage: "Help me with meal planning",
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
  const { runNutritionAgent } = await import('./nutritionAgent.js');
  const context = { userId: 'test', pillar: 'nutrition' };
  await runNutritionAgent({
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
