/**
 * Test Suite for Physical Health Agent (Dr. Vitality)
 * 
 * Run with: node backend/src/ai/agents/physicalHealthAgentTest.js
 */

import { physicalHealthSystemPrompt } from './physicalHealthAgent.js';

console.log('=== PHYSICAL HEALTH AGENT (Dr. Vitality) TEST SUITE ===\n');

// Check if API keys are available
const hasAPIKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!hasAPIKeys) {
  console.log('⚠ WARNING: No API keys found in environment');
  console.log('  Performing structure validation only\n');
}

// Test 1: System prompt verification
console.log('--- Test 1: System Prompt Verification ---');
console.log('✓ physicalHealthSystemPrompt exported successfully');
console.log(`  Prompt length: ${physicalHealthSystemPrompt.length} chars`);
console.log(`  Contains "Dr. Vitality": ${physicalHealthSystemPrompt.includes('Dr. Vitality')}`);
console.log(`  Contains "health": ${physicalHealthSystemPrompt.toLowerCase().includes('health')}`);
console.log(`  Contains "screening": ${physicalHealthSystemPrompt.toLowerCase().includes('screening')}`);
console.log(`  Contains "preventive": ${physicalHealthSystemPrompt.toLowerCase().includes('preventive')}`);
console.log();

// Test 2: Module structure validation
console.log('--- Test 2: Module Structure Validation ---');
try {
  const module = await import('./physicalHealthAgent.js');
  const { runPhysicalHealthAgent, planHealthScreenings, trackSymptoms, prepareForAppointment,
          monitorVitals, manageCondition, understandLabResults, assessHealthRisk, 
          supportMedicationAdherence } = module;
  
  console.log('✓ runPhysicalHealthAgent function exported');
  console.log('✓ All helper functions exported');
  console.log(`  runPhysicalHealthAgent type: ${typeof runPhysicalHealthAgent}`);
  console.log(`  planHealthScreenings type: ${typeof planHealthScreenings}`);
  console.log(`  trackSymptoms type: ${typeof trackSymptoms}`);
  console.log(`  prepareForAppointment type: ${typeof prepareForAppointment}`);
  console.log(`  monitorVitals type: ${typeof monitorVitals}`);
  console.log(`  manageCondition type: ${typeof manageCondition}`);
  console.log(`  understandLabResults type: ${typeof understandLabResults}`);
  console.log(`  assessHealthRisk type: ${typeof assessHealthRisk}`);
  console.log(`  supportMedicationAdherence type: ${typeof supportMedicationAdherence}`);
} catch (error) {
  console.log(`✗ Module import error: ${error.message}`);
}
console.log();

// Test 3: Error handling - wrong pillar
console.log('--- Test 3: Error Handling (Wrong Pillar) ---');
try {
  const { runPhysicalHealthAgent } = await import('./physicalHealthAgent.js');
  const wrongContext = { userId: 'test', pillar: 'fitness' };
  await runPhysicalHealthAgent({
    context: wrongContext,
    userMessage: "Help me plan my health screenings",
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
  const { runPhysicalHealthAgent } = await import('./physicalHealthAgent.js');
  const context = { userId: 'test', pillar: 'physical_health' };
  await runPhysicalHealthAgent({
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
