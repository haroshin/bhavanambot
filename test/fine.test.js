import assert from 'assert';
import { fineService } from '../src/services/fineService.js';
import { storage } from '../src/storage/store.js';

console.log('🧪 Running Bhavanam Fine & Penalty System Unit Tests...\n');

const originalFines = storage.getFines();

try {
  // Test 1: Admin verification for Arjun
  const arjunUser = { id: 5048376485, username: 'arjun_pk', first_name: 'Arjun' };
  const randomUser = { id: 111, username: 'other', first_name: 'Other' };

  assert.strictEqual(fineService.isAdmin(arjunUser), true, 'Arjun should be verified as admin');
  assert.strictEqual(fineService.isAdmin(randomUser), false, 'Non-Arjun user should not be admin');
  console.log('✅ Test 1 Passed: Admin verification for Arjun passed.');

  // Test 2: Add fine
  fineService.addFine('haroshin', 50, 'Test penalty');
  const fines1 = storage.getFines();
  assert.strictEqual(fines1.haroshin.balance, 50, 'haroshin should have 50 fine balance');
  console.log('✅ Test 2 Passed: Added ₹50 fine to haroshin.');

  // Test 3: Non-admin trying to deduct fine
  const failDeduct = fineService.deductFine(randomUser, 'haroshin', 50);
  assert.strictEqual(failDeduct.success, false);
  assert.strictEqual(failDeduct.reason, 'NOT_ADMIN');
  console.log('✅ Test 3 Passed: Non-admin fine deduction attempt was blocked.');

  // Test 4: Admin Arjun deducting fine
  const passDeduct = fineService.deductFine(arjunUser, 'haroshin', 50);
  assert.strictEqual(passDeduct.success, true);
  assert.strictEqual(passDeduct.deductedAmount, 50);
  assert.strictEqual(passDeduct.remainingBalance, 0);
  console.log('✅ Test 4 Passed: Admin Arjun successfully deducted ₹50 fine from haroshin.');

  console.log('\n🎉 ALL FINE SYSTEM UNIT TESTS PASSED SUCCESSFULLY!');
} finally {
  storage.saveFines(originalFines);
}
