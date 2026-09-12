import assert from 'assert';
import { roundRobinService } from '../src/services/roundRobin.js';
import { storage } from '../src/storage/store.js';

console.log('🧪 Running Bhavanam Round-Robin Service Unit Tests...\n');

// Backup existing state/members
const originalMembers = storage.getMembers();
const originalState = storage.getState();

try {
  // Test 1: Load members
  const status = roundRobinService.getStatus();
  assert.strictEqual(status.members.length, 8, 'Initial member list should contain 8 users');
  console.log('✅ Test 1 Passed: Initial member list loaded correctly (8 users).');

  // Test 2: Trigger duty rotation
  storage.saveState({ currentIndex: 0, lastTriggered: null, history: [], pendingTask: null });
  
  const trigger1 = roundRobinService.triggerDuty('Test 1');
  assert.strictEqual(trigger1.success, true);
  assert.strictEqual(trigger1.assignedMember.name, 'Arjun');
  assert.strictEqual(trigger1.nextMember.name, 'haroshin');
  console.log('✅ Test 2 Passed: First duty trigger assigned Arjun and set task status to PENDING.');

  // Test 3: Unauthorized user typing "done"
  const wrongUserComplete = roundRobinService.completeTask({ id: 999, first_name: 'WrongUser' });
  assert.strictEqual(wrongUserComplete.success, false);
  assert.strictEqual(wrongUserComplete.reason, 'NOT_ASSIGNED_USER');
  console.log('✅ Test 3 Passed: Unauthorized user typing "done" was rejected.');

  // Test 4: Assigned user typing "done" (case-insensitive)
  const rightUserComplete = roundRobinService.completeTask({ id: 101, first_name: 'Arjun', username: 'Arjun' });
  assert.strictEqual(rightUserComplete.success, true);
  assert.strictEqual(rightUserComplete.completedMember.name, 'Arjun');
  assert.strictEqual(rightUserComplete.nextMember.name, 'haroshin');
  assert.strictEqual(rightUserComplete.newIndex, 1);
  console.log('✅ Test 4 Passed: Assigned user typing "done" completed task and advanced index to haroshin.');

  // Test 5: Skip Turn
  const skipRes = roundRobinService.skipTurn();
  assert.strictEqual(skipRes.skippedMember.name, 'haroshin');
  assert.strictEqual(skipRes.nextMember.name, 'Azim');
  assert.strictEqual(skipRes.newIndex, 2);
  console.log('✅ Test 5 Passed: Skip turn skipped haroshin and set next pointer to Azim.');

  // Test 6: Set Turn manually
  const setTurnRes = roundRobinService.setTurn('Yohaan_libert');
  assert.strictEqual(setTurnRes.success, true);
  assert.strictEqual(setTurnRes.assignedMember.name, 'Yohaan_libert');
  assert.strictEqual(setTurnRes.currentIndex, 6);
  console.log('✅ Test 6 Passed: Set turn manually set index to Yohaan_libert (index 6).');

  // Test 7: Schedule Calendar date progression after completing today's duty
  storage.saveState({ currentIndex: 0, lastTriggered: null, history: [], pendingTask: null });
  roundRobinService.triggerDuty('Test 7');
  roundRobinService.completeTask({ id: 101, first_name: 'Arjun', username: 'Arjun' });

  const schedAfterComplete = roundRobinService.getScheduleCalendar();
  const firstItem = schedAfterComplete.schedule[0]; // Should be haroshin
  assert.strictEqual(firstItem.member.name, 'haroshin');
  assert.strictEqual(firstItem.isTomorrow, true, 'haroshin should be scheduled for tomorrow after today duty is completed');
  console.log('✅ Test 7 Passed: Schedule calendar correctly assigns tomorrow date to haroshin after today duty completion.');

  // Test 8: Midnight penalty check advances index
  const { fineService } = await import('../src/services/fineService.js');
  storage.saveState({ currentIndex: 0, lastTriggered: null, history: [], pendingTask: null });
  roundRobinService.triggerDuty('Test 8');
  const penaltyRes = fineService.checkTrashMidnightPenalty();
  assert.strictEqual(penaltyRes.member.name, 'Arjun');
  const stateAfterPenalty = storage.getState();
  assert.strictEqual(stateAfterPenalty.currentIndex, 1, 'Index should advance to 1 (haroshin) after midnight penalty');
  console.log('✅ Test 8 Passed: Midnight penalty check fined Arjun and correctly advanced turn index to haroshin.');

  // Test 9: Stale pending task from previous day auto-expires on next triggerDuty
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  storage.saveState({
    currentIndex: 0,
    lastTriggered: yesterday.toISOString(),
    history: [],
    pendingTask: {
      assignedMember: originalMembers[0],
      assignedAt: yesterday.toISOString(),
      triggeredBy: 'Yesterday',
      status: 'PENDING'
    }
  });
  const newDayTrigger = roundRobinService.triggerDuty('New Day Trigger');
  assert.strictEqual(newDayTrigger.assignedMember.name, 'haroshin', 'New day trigger should auto-expire yesterday task and assign haroshin');
  console.log('✅ Test 9 Passed: Stale task from previous day was auto-expired and turn advanced to haroshin.');

  console.log('\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!');
} finally {
  // Restore original state/members
  storage.saveMembers(originalMembers);
  storage.saveState(originalState);
}
