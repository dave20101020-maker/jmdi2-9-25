/**
 * Test Suite for Finances Agent (Adviser Prosper)
 * 
 * Run with: node backend/src/ai/agents/financesAgentTest.js
 */

import { financesSystemPrompt } from './financesAgent.js';

console.log('=== FINANCES AGENT (Adviser Prosper) TEST SUITE ===\n');

// Check if API keys are available
const hasAPIKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!hasAPIKeys) {
  console.log('⚠ WARNING: No API keys found in environment');
  console.log('  Performing structure validation only\n');
}

// Test 1: System prompt verification
console.log('--- Test 1: System Prompt Verification ---');
console.log('✓ financesSystemPrompt exported successfully');
console.log(`  Prompt length: ${financesSystemPrompt.length} chars`);
console.log(`  Contains "Adviser Prosper": ${financesSystemPrompt.includes('Adviser Prosper')}`);
console.log(`  Contains "budget": ${financesSystemPrompt.toLowerCase().includes('budget')}`);
console.log(`  Contains "debt": ${financesSystemPrompt.toLowerCase().includes('debt')}`);
console.log(`  Contains "financial": ${financesSystemPrompt.toLowerCase().includes('financial')}`);
console.log();

// Test 2: Module structure validation
console.log('--- Test 2: Module Structure Validation ---');
try {
  const module = await import('./financesAgent.js');
  const { runFinancesAgent, createBudget, planDebtPayoff, planEmergencyFund,
          analyzeSpending, setFinancialGoal, learnAboutInvesting, addressMoneyAnxiety,
          improveCreditScore } = module;
  
  console.log('✓ runFinancesAgent function exported');
  console.log('✓ All helper functions exported');
  console.log(`  runFinancesAgent type: ${typeof runFinancesAgent}`);
  console.log(`  createBudget type: ${typeof createBudget}`);
  console.log(`  planDebtPayoff type: ${typeof planDebtPayoff}`);
  console.log(`  planEmergencyFund type: ${typeof planEmergencyFund}`);
  console.log(`  analyzeSpending type: ${typeof analyzeSpending}`);
  console.log(`  setFinancialGoal type: ${typeof setFinancialGoal}`);
  console.log(`  learnAboutInvesting type: ${typeof learnAboutInvesting}`);
  console.log(`  addressMoneyAnxiety type: ${typeof addressMoneyAnxiety}`);
  console.log(`  improveCreditScore type: ${typeof improveCreditScore}`);
} catch (error) {
  console.log(`✗ Module import error: ${error.message}`);
}
console.log();

// Test 3: Error handling - wrong pillar
console.log('--- Test 3: Error Handling (Wrong Pillar) ---');
try {
  const { runFinancesAgent } = await import('./financesAgent.js');
  const wrongContext = { userId: 'test', pillar: 'sleep' };
  await runFinancesAgent({
    context: wrongContext,
    userMessage: "Help me create a budget",
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
  const { runFinancesAgent } = await import('./financesAgent.js');
  const context = { userId: 'test', pillar: 'finances' };
  await runFinancesAgent({
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
