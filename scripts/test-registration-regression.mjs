import assert from 'node:assert';
import { authService } from '../src/services/auth.ts';
import { lelamStore } from '../src/lib/store.ts';

async function testRegistrationRegression() {
  console.log('==================================================================');
  console.log('LELAM RANK — REGISTRATION REGRESSION AUDIT SUITE');
  console.log('==================================================================\n');

  const ts = Date.now().toString().slice(-4);
  const username = `reg_founder_${ts}`;
  const email = `reg_founder_${ts}@example.com`;
  const password = 'Password123!';

  console.log('--- TEST 1: Register New Account ---');
  const t0 = Date.now();
  const regResult = await authService.signUp(username, email, password, 'Regression Founder');
  const elapsed = Date.now() - t0;
  console.log(`Registration completed in ${elapsed}ms`);

  assert.strictEqual(Boolean(regResult.user), true, 'User profile returned');
  assert.strictEqual(regResult.user?.username, username, 'Username matches input');
  assert.strictEqual(regResult.error, null, 'Error is null');
  console.log('✓ PASS: Registration succeeded without timeout or error');

  console.log('\n--- TEST 2: Active Session & Store Verification ---');
  const currentUser = await authService.getCurrentUser();
  assert.strictEqual(Boolean(currentUser), true, 'Current user resolves from store');
  assert.strictEqual(currentUser?.username, username, 'Store matches registered user');
  console.log('✓ PASS: Session established and active user stored');

  console.log('\n--- TEST 3: Invalid Formats Rejection ---');
  const shortUser = await authService.signUp('a', email, password);
  assert.strictEqual(shortUser.user, null, 'Short username rejected');
  assert.strictEqual(Boolean(shortUser.error), true, 'Error message returned for short username');

  const invalidEmail = await authService.signUp(`valid_${ts}`, 'notanemail', password);
  assert.strictEqual(invalidEmail.user, null, 'Invalid email rejected');
  assert.strictEqual(Boolean(invalidEmail.error), true, 'Error message returned for invalid email');

  const shortPass = await authService.signUp(`valid2_${ts}`, `valid2_${ts}@example.com`, '123');
  assert.strictEqual(shortPass.user, null, 'Short password rejected');
  assert.strictEqual(Boolean(shortPass.error), true, 'Error message returned for short password');
  console.log('✓ PASS: All format validation gates strictly enforced');

  console.log('\n--- TEST 4: Sign Out Cleanup ---');
  await authService.signOut();
  const loggedOutUser = await authService.getCurrentUser();
  assert.strictEqual(loggedOutUser, null, 'Store user is null after logout');
  console.log('✓ PASS: Logout completely cleared user state');

  console.log('\n==================================================================');
  console.log('ALL REGISTRATION REGRESSION AUDIT TESTS PASSED');
  console.log('==================================================================');
}

testRegistrationRegression().catch((err) => {
  console.error('Regression test failed:', err);
  process.exit(1);
});
