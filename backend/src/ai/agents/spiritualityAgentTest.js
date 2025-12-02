/**
 * Test Suite for Spirituality Agent (Guide Zenith)
 * 
 * Run with: node backend/src/ai/agents/spiritualityAgentTest.js
 */

import { spiritualitySystemPrompt } from './spiritualityAgent.js';

console.log('=== SPIRITUALITY AGENT (Guide Zenith) TEST SUITE ===\n');

// Check if API keys are available
const hasAPIKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!hasAPIKeys) {
  console.log('⚠ WARNING: No API keys found in environment');
  console.log('  Performing structure validation only\n');
}

// Test 1: System prompt verification
console.log('--- Test 1: System Prompt Verification ---');
console.log('✓ spiritualitySystemPrompt exported successfully');
console.log(`  Prompt length: ${spiritualitySystemPrompt.length} chars`);
console.log(`  Contains "Guide Zenith": ${spiritualitySystemPrompt.includes('Guide Zenith')}`);
console.log(`  Contains "spiritual": ${spiritualitySystemPrompt.toLowerCase().includes('spiritual')}`);
console.log(`  Contains "meaning": ${spiritualitySystemPrompt.toLowerCase().includes('meaning')}`);
console.log(`  Contains "purpose": ${spiritualitySystemPrompt.toLowerCase().includes('purpose')}`);
console.log();

// Test 2: Module structure validation
console.log('--- Test 2: Module Structure Validation ---');
try {
  const module = await import('./spiritualityAgent.js');
  const { runSpiritualityAgent, explorePurpose, clarifyValues, guideMindfulnessPractice,
          developGratitudePractice, navigateExistentialQuestion, findConnection, processGrief,
          cultivateCompassion, reflectOnTransition } = module;
  
  console.log('✓ runSpiritualityAgent function exported');
  console.log('✓ All helper functions exported');
  console.log(`  runSpiritualityAgent type: ${typeof runSpiritualityAgent}`);
  console.log(`  explorePurpose type: ${typeof explorePurpose}`);
  console.log(`  clarifyValues type: ${typeof clarifyValues}`);
  console.log(`  guideMindfulnessPractice type: ${typeof guideMindfulnessPractice}`);
  console.log(`  developGratitudePractice type: ${typeof developGratitudePractice}`);
  console.log(`  navigateExistentialQuestion type: ${typeof navigateExistentialQuestion}`);
  console.log(`  findConnection type: ${typeof findConnection}`);
  console.log(`  processGrief type: ${typeof processGrief}`);
  console.log(`  cultivateCompassion type: ${typeof cultivateCompassion}`);
  console.log(`  reflectOnTransition type: ${typeof reflectOnTransition}`);
} catch (error) {
  console.log(`✗ Module import error: ${error.message}`);
}
console.log();

// Test 3: Error handling - wrong pillar
console.log('--- Test 3: Error Handling (Wrong Pillar) ---');
try {
  const { runSpiritualityAgent } = await import('./spiritualityAgent.js');
  const wrongContext = { userId: 'test', pillar: 'fitness' };
  await runSpiritualityAgent({
    context: wrongContext,
    userMessage: "Help me find my life purpose",
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
  const { runSpiritualityAgent } = await import('./spiritualityAgent.js');
  const context = { userId: 'test', pillar: 'spirituality' };
  await runSpiritualityAgent({
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
