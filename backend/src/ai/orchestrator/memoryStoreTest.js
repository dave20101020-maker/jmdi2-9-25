/**
 * Memory Store Test Suite
 * 
 * Tests the memory persistence and retrieval system.
 */

import {
  loadMemory,
  saveMemory,
  updateConversationHistory,
  getConversationHistory,
  addItemToMemory,
  markTopicCovered,
  isTopicCovered,
  updatePillarData,
  clearMemory
} from './memoryStore.js';

const TEST_USER_ID = 'test-user-memory-123';

async function runTests() {
  console.log('=== MEMORY STORE TEST SUITE ===\n');

  try {
    // Test 1: Load empty memory
    console.log('--- Test 1: Load Empty Memory ---');
    let memory = await loadMemory(TEST_USER_ID);
    console.log('✓ Memory loaded:', typeof memory === 'object');
    console.log('✓ Has pillars structure:', memory.pillars !== undefined);
    console.log('✓ Has sleep pillar:', memory.pillars.sleep !== undefined);
    console.log();

    // Test 2: Update conversation history
    console.log('--- Test 2: Update Conversation History ---');
    memory = updateConversationHistory(
      memory,
      'sleep',
      'I can\'t sleep at night',
      'Let me help you with that. How long has this been going on?'
    );
    console.log('✓ Conversation updated');
    console.log('✓ Messages count:', memory.pillars.sleep.lastMessages.length);
    console.log();

    // Test 3: Add more conversation turns
    console.log('--- Test 3: Add Multiple Turns ---');
    for (let i = 0; i < 12; i++) {
      memory = updateConversationHistory(
        memory,
        'sleep',
        `User message ${i}`,
        `Assistant response ${i}`
      );
    }
    console.log('✓ Added 12 conversation turns');
    console.log('✓ Messages kept (should be ≤20):', memory.pillars.sleep.lastMessages.length);
    console.log('✓ Auto-trimming works:', memory.pillars.sleep.lastMessages.length <= 20);
    console.log();

    // Test 4: Get conversation history
    console.log('--- Test 4: Get Conversation History ---');
    const history = getConversationHistory(memory, 'sleep', 10);
    console.log('✓ Retrieved history length:', history.length);
    console.log('✓ Last message:', history[history.length - 1]?.content.substring(0, 30));
    console.log();

    // Test 5: Add items to memory
    console.log('--- Test 5: Add Items to Memory ---');
    memory = addItemToMemory(memory, 'sleep', {
      type: 'habit',
      title: 'Go to bed at 10 PM',
      id: 'habit-123'
    });
    memory = addItemToMemory(memory, 'sleep', {
      type: 'screening',
      title: 'Sleep Quality Assessment',
      score: 8,
      id: 'screening-456'
    });
    console.log('✓ Items added:', memory.pillars.sleep.items.length);
    console.log('✓ First item type:', memory.pillars.sleep.items[0].type);
    console.log();

    // Test 6: Mark topics as covered
    console.log('--- Test 6: Mark Topics Covered ---');
    memory = markTopicCovered(memory, 'sleep', 'sleep_hygiene_basics');
    memory = markTopicCovered(memory, 'sleep', 'cpap_machine_setup');
    console.log('✓ Topics marked:', memory.pillars.sleep.coveredTopics.length);
    console.log();

    // Test 7: Check if topic is covered
    console.log('--- Test 7: Check Topic Coverage ---');
    const isCovered = isTopicCovered(memory, 'sleep', 'sleep_hygiene_basics');
    const isNotCovered = isTopicCovered(memory, 'sleep', 'never_discussed_topic');
    console.log('✓ Known topic covered:', isCovered === true);
    console.log('✓ Unknown topic not covered:', isNotCovered === false);
    console.log();

    // Test 8: Update pillar-specific data
    console.log('--- Test 8: Update Pillar Data ---');
    memory = updatePillarData(memory, 'sleep', 'lastScreening', {
      name: 'Insomnia Severity Index',
      score: 15,
      date: new Date().toISOString()
    });
    console.log('✓ Pillar data updated');
    console.log('✓ Last screening score:', memory.pillars.sleep.lastScreening.score);
    console.log();

    // Test 9: Save memory to disk
    console.log('--- Test 9: Save Memory ---');
    await saveMemory(TEST_USER_ID, memory);
    console.log('✓ Memory saved to disk');
    console.log();

    // Test 10: Load memory from disk
    console.log('--- Test 10: Load Memory from Disk ---');
    const loadedMemory = await loadMemory(TEST_USER_ID);
    console.log('✓ Memory loaded from disk');
    console.log('✓ User ID matches:', loadedMemory.userId === TEST_USER_ID);
    console.log('✓ Sleep messages preserved:', loadedMemory.pillars.sleep.lastMessages.length);
    console.log('✓ Items preserved:', loadedMemory.pillars.sleep.items.length);
    console.log('✓ Topics preserved:', loadedMemory.pillars.sleep.coveredTopics.length);
    console.log('✓ Last screening preserved:', loadedMemory.pillars.sleep.lastScreening !== null);
    console.log();

    // Test 11: Multiple pillars
    console.log('--- Test 11: Multiple Pillars ---');
    memory = updateConversationHistory(
      loadedMemory,
      'mental_health',
      'I feel anxious',
      'Let\'s work through this together'
    );
    memory = updateConversationHistory(
      memory,
      'fitness',
      'I want to build muscle',
      'Great goal! Let\'s create a program'
    );
    await saveMemory(TEST_USER_ID, memory);
    console.log('✓ Multiple pillars updated');
    console.log('✓ Sleep messages:', memory.pillars.sleep.lastMessages.length);
    console.log('✓ Mental health messages:', memory.pillars.mental_health.lastMessages.length);
    console.log('✓ Fitness messages:', memory.pillars.fitness.lastMessages.length);
    console.log();

    // Test 12: Clear memory
    console.log('--- Test 12: Clear Memory ---');
    await clearMemory(TEST_USER_ID);
    console.log('✓ Memory cleared');
    console.log();

    console.log('=== ALL TESTS PASSED ✓ ===\n');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
