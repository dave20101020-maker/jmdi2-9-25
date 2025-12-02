/**
 * NorthStar AI Usage Examples
 * 
 * Demonstrates how to use the complete NorthStar AI system with memory.
 */

import { 
  runNorthStarAI, 
  loadMemory, 
  saveMemory,
  updatePillarData,
  markTopicCovered,
  addItemToMemory 
} from './northstarOrchestrator.js';

// ============================================
// EXAMPLE 1: Basic Usage (Auto Pillar Detection)
// ============================================
async function example1_basicUsage() {
  console.log('\n=== EXAMPLE 1: Basic Usage ===\n');
  
  const result = await runNorthStarAI({
    userId: 'user123',
    message: 'I can\'t sleep at night'
  });

  console.log('Pillar detected:', result.pillar);
  console.log('AI Response:', result.text);
  console.log('Model used:', result.model);
}

// ============================================
// EXAMPLE 2: Force Specific Pillar
// ============================================
async function example2_explicitPillar() {
  console.log('\n=== EXAMPLE 2: Force Specific Pillar ===\n');
  
  const result = await runNorthStarAI({
    userId: 'user123',
    message: 'I want to improve my wellness',
    explicitPillar: 'fitness' // Force fitness agent
  });

  console.log('Forced pillar:', result.pillar);
  console.log('AI Response:', result.text);
}

// ============================================
// EXAMPLE 3: Conversation with Context
// ============================================
async function example3_conversationWithContext() {
  console.log('\n=== EXAMPLE 3: Conversation with Context ===\n');
  
  const userId = 'user456';

  // First message
  const msg1 = await runNorthStarAI({
    userId,
    message: 'I want to lose 20 pounds'
  });
  console.log('First response:', msg1.text.substring(0, 100) + '...');

  // Second message - memory will provide context
  const msg2 = await runNorthStarAI({
    userId,
    message: 'What should I eat for breakfast?'
  });
  console.log('Second response (with context):', msg2.text.substring(0, 100) + '...');

  // Check memory
  const memory = await loadMemory(userId);
  console.log('Conversation turns saved:', memory.pillars.nutrition.lastMessages.length / 2);
}

// ============================================
// EXAMPLE 4: Custom Memory Management
// ============================================
async function example4_customMemory() {
  console.log('\n=== EXAMPLE 4: Custom Memory Management ===\n');
  
  const userId = 'user789';
  
  // Load existing memory
  let memory = await loadMemory(userId);
  
  // Add custom pillar data
  memory = updatePillarData(memory, 'sleep', 'lastScreening', {
    name: 'Insomnia Severity Index',
    score: 15,
    interpretation: 'Moderate insomnia',
    date: new Date().toISOString()
  });
  
  // Mark topics as covered
  memory = markTopicCovered(memory, 'sleep', 'sleep_hygiene_basics');
  memory = markTopicCovered(memory, 'sleep', 'cbti_introduction');
  
  // Add tracked items
  memory = addItemToMemory(memory, 'sleep', {
    type: 'habit',
    title: 'Go to bed at 10 PM',
    frequency: 'daily',
    id: 'habit-001'
  });
  
  // Save updated memory
  await saveMemory(userId, memory);
  
  console.log('Memory updated with:');
  console.log('  • Last screening:', memory.pillars.sleep.lastScreening.name);
  console.log('  • Topics covered:', memory.pillars.sleep.coveredTopics.length);
  console.log('  • Items tracked:', memory.pillars.sleep.items.length);
}

// ============================================
// EXAMPLE 5: Error Handling
// ============================================
async function example5_errorHandling() {
  console.log('\n=== EXAMPLE 5: Error Handling ===\n');
  
  // Invalid message (empty)
  const result1 = await runNorthStarAI({
    userId: 'user123',
    message: ''
  });
  
  if (!result1.ok) {
    console.log('Error caught:', result1.error);
  }
  
  // Missing userId
  const result2 = await runNorthStarAI({
    userId: null,
    message: 'Hello'
  });
  
  if (!result2.ok) {
    console.log('Error caught:', result2.error);
  }
}

// ============================================
// EXAMPLE 6: Multi-Pillar Conversation
// ============================================
async function example6_multiPillar() {
  console.log('\n=== EXAMPLE 6: Multi-Pillar Conversation ===\n');
  
  const userId = 'user-multi';
  
  // Talk to different agents
  const sleep = await runNorthStarAI({
    userId,
    message: 'Help me sleep better'
  });
  console.log('Sleep agent:', sleep.pillar);
  
  const mental = await runNorthStarAI({
    userId,
    message: 'I feel stressed'
  });
  console.log('Mental health agent:', mental.pillar);
  
  const fitness = await runNorthStarAI({
    userId,
    message: 'Create a workout plan'
  });
  console.log('Fitness agent:', fitness.pillar);
  
  // Check memory - each pillar has separate history
  const memory = await loadMemory(userId);
  console.log('\nSeparate conversation histories:');
  console.log('  • Sleep:', memory.pillars.sleep.lastMessages.length, 'messages');
  console.log('  • Mental Health:', memory.pillars.mental_health.lastMessages.length, 'messages');
  console.log('  • Fitness:', memory.pillars.fitness.lastMessages.length, 'messages');
}

// ============================================
// EXAMPLE 7: Express.js API Integration
// ============================================
function example7_expressIntegration() {
  console.log('\n=== EXAMPLE 7: Express.js API Integration ===\n');
  
  console.log(`
// Express route example:
import express from 'express';
import { runNorthStarAI } from './src/ai/orchestrator/northstarOrchestrator.js';

const app = express();
app.use(express.json());

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, pillar } = req.body;
    const userId = req.user.id; // From auth middleware
    
    const result = await runNorthStarAI({
      userId,
      message,
      explicitPillar: pillar
    });
    
    if (result.ok) {
      res.json({
        success: true,
        pillar: result.pillar,
        message: result.text,
        model: result.model
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => console.log('NorthStar AI API running on :3000'));
  `);
}

// ============================================
// RUN ALL EXAMPLES
// ============================================
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   NORTHSTAR AI USAGE EXAMPLES              ║');
  console.log('╚════════════════════════════════════════════╝');
  
  console.log('\n⚠️  Note: Running in validation mode (no API keys needed)');
  console.log('⚠️  In production, set OPENAI_API_KEY and ANTHROPIC_API_KEY\n');
  
  try {
    // Uncomment to run specific examples:
    // await example1_basicUsage();
    // await example2_explicitPillar();
    // await example3_conversationWithContext();
    // await example4_customMemory();
    // await example5_errorHandling();
    // await example6_multiPillar();
    example7_expressIntegration();
    
    console.log('\n✓ Examples completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Example failed:', error.message);
    console.error(error.stack);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_basicUsage,
  example2_explicitPillar,
  example3_conversationWithContext,
  example4_customMemory,
  example5_errorHandling,
  example6_multiPillar,
  example7_expressIntegration
};
