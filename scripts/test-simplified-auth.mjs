import assert from 'assert';
import { authService } from '../src/services/auth.js';

async function testSimplifiedAuth() {
  console.log('==================================================');
  console.log('LELAM RANK — SIMPLIFIED AUTHENTICATION TEST SUITE');
  console.log('==================================================\n');

  // 1. Test Username Validation Format
  console.log('--- 1. Testing Username Validation ---');
  const shortUser = await authService.checkUsernameAvailable('ab');
  assert.strictEqual(shortUser.available, false, 'Short username (<3 chars) must be invalid');

  const invalidCharUser = await authService.checkUsernameAvailable('user@name!');
  assert.strictEqual(invalidCharUser.available, false, 'Invalid characters in username must be rejected');

  const validUserCheck = await authService.checkUsernameAvailable('kerala_founder_99');
  assert.strictEqual(validUserCheck.available, true, 'Valid username format should pass');
  console.log('✓ PASS: Username format validation (alphanumeric + underscores, 3-25 chars)');

  // 2. Test Instant Registration Without Email Verification
  console.log('\n--- 2. Testing Instant Registration (No Email Verification Screen) ---');
  const testEmail = `test_founder_${Date.now()}@example.com`;
  const testUsername = `founder_${Date.now().toString().slice(-6)}`;
  const testPassword = 'SecurePassword123!';

  const signUpRes = await authService.signUp(testUsername, testEmail, testPassword);
  console.log('SignUp result:', {
    user: signUpRes.user ? { id: signUpRes.user.id, username: signUpRes.user.username, email: signUpRes.user.email } : null,
    error: signUpRes.error,
    requiresEmailVerification: signUpRes.requiresEmailVerification,
  });

  assert.strictEqual(signUpRes.error, null, 'SignUp should succeed without errors');
  assert.ok(signUpRes.user, 'SignUp must return an active UserProfile immediately');
  assert.strictEqual(signUpRes.requiresEmailVerification, false, 'requiresEmailVerification must be false');
  assert.strictEqual(signUpRes.user.username, testUsername, 'Username must match registered username');
  console.log('✓ PASS: Instant registration active with username, zero email confirmation wait');

  // 3. Test Duplicate Username Protection
  console.log('\n--- 3. Testing Duplicate Username Protection ---');
  const dupUserSignUp = await authService.signUp(testUsername, `another_${Date.now()}@example.com`, testPassword);
  console.log('Duplicate username signup error:', dupUserSignUp.error);
  assert.ok(dupUserSignUp.error, 'Duplicate username must be rejected');
  console.log('✓ PASS: Username uniqueness strictly enforced');

  // 4. Test Login with Email + Password
  console.log('\n--- 4. Testing Login with Email + Password ---');
  const signInRes = await authService.signIn(testEmail, testPassword);
  assert.strictEqual(signInRes.error, null, 'SignIn with email should succeed');
  assert.ok(signInRes.user, 'SignIn must return authenticated user');
  assert.strictEqual(signInRes.user.username, testUsername, 'Authenticated user must have public username');
  console.log('✓ PASS: Login with email works seamlessly');

  // 5. Test Current User Session & Public/Private Field Protection
  console.log('\n--- 5. Testing Session & Public Username Display ---');
  const currentUser = await authService.getCurrentUser();
  assert.ok(currentUser, 'getCurrentUser must return active session');
  assert.strictEqual(currentUser.username, testUsername, 'Session contains public username');
  console.log('✓ PASS: Active session contains public username for leaderboard identity');

  // 6. Test Sign Out
  console.log('\n--- 6. Testing Sign Out ---');
  await authService.signOut();
  console.log('✓ PASS: Sign out completed cleanly');

  console.log('\n==================================================');
  console.log('ALL SIMPLIFIED AUTHENTICATION TESTS PASSED');
  console.log('==================================================');
}

testSimplifiedAuth().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
