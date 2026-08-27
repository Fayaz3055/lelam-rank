import assert from 'assert';
import { authService } from '../src/services/auth.js';

async function testAnonymousLogin() {
  console.log('==================================================');
  console.log('LELAM RANK — ANONYMOUS / GUEST LOGIN TEST SUITE');
  console.log('==================================================\n');

  // 1. Test Anonymous Sign-In
  console.log('--- 1. Testing Anonymous / Guest Sign-In ---');
  const guestRes = await authService.signInAnonymously();
  console.log('Guest Sign-In response:', guestRes);

  assert.strictEqual(guestRes.error, null, 'Guest sign-in should succeed without errors');
  assert.ok(guestRes.user, 'Guest sign-in must return a UserProfile');
  assert.strictEqual(guestRes.user.is_anonymous, true, 'is_anonymous must be true for guest');
  assert.strictEqual(guestRes.user.username, 'Guest', 'Username should be Guest');
  console.log('✓ PASS: Anonymous sign-in creates an active guest session');

  // 2. Test Guest Permissions vs Registered User Check
  console.log('\n--- 2. Testing isRegisteredUser Check on Guest ---');
  const isGuestRegistered = authService.isRegisteredUser(guestRes.user);
  assert.strictEqual(isGuestRegistered, false, 'Guest user must NOT be classified as registered');
  console.log('✓ PASS: Guest user correctly identified as non-registered');

  // 3. Test Normal User Registration
  console.log('\n--- 3. Testing Normal Registered User Sign-Up ---');
  const regEmail = `founder_${Date.now()}@example.com`;
  const regUser = `tech_${Date.now().toString().slice(-6)}`;
  const regRes = await authService.signUp(regUser, regEmail, 'Password123!');

  assert.strictEqual(regRes.error, null);
  assert.ok(regRes.user);
  assert.strictEqual(regRes.user.is_anonymous, false, 'is_anonymous must be false for registered user');
  assert.strictEqual(regRes.user.username, regUser);

  const isRegRegistered = authService.isRegisteredUser(regRes.user);
  assert.strictEqual(isRegRegistered, true, 'Registered user must be classified as registered');
  console.log('✓ PASS: Normal registration establishes a full registered founder session');

  // 4. Test Sign Out
  console.log('\n--- 4. Testing Sign Out ---');
  await authService.signOut();
  console.log('✓ PASS: Sign out completed cleanly');

  console.log('\n==================================================');
  console.log('ALL ANONYMOUS LOGIN TESTS PASSED');
  console.log('==================================================');
}

testAnonymousLogin().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
