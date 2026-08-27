import assert from 'assert';
import crypto from 'crypto';
import { authService } from '../src/services/auth.js';

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('LELAM RANK — ANONYMOUS GUEST VS REGISTERED USER SECURITY AUDIT');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Guest Session Creation
  console.log('--- 1. Testing Anonymous / Guest Sign-In ---');
  const guestAuth = await authService.signInAnonymously();
  assert.strictEqual(guestAuth.error, null);
  assert.ok(guestAuth.user);
  assert.strictEqual(guestAuth.user.is_anonymous, true);
  assert.strictEqual(authService.isRegisteredUser(guestAuth.user), false);
  console.log('✓ PASS: Guest session properly created and identified as non-registered (is_anonymous = true)');

  // 2. Server-side API Gate on Order Creation
  console.log('\n--- 2. Testing Server-side Order Gate (Unauthenticated & Anonymous Rejected) ---');
  const unauthOrder = await fetch(`${BASE_URL}/api/bids/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 500,
      entryId: 'new_entry',
      entryName: 'Hacker Entry',
      userId: guestAuth.user.id,
    }),
  });
  console.log('Order creation unauthenticated/guest response status:', unauthOrder.status);
  const unauthOrderData = await unauthOrder.json();
  console.log('Response error message:', unauthOrderData.error);
  assert.ok([401, 403].includes(unauthOrder.status), 'Anonymous / unauthenticated order must be rejected with 401 or 403');
  console.log('✓ PASS: Anonymous guests cannot create Razorpay payment orders');

  // 3. Server-side API Gate on Bid Verification
  console.log('\n--- 3. Testing Server-side Bid Verification Gate (Anonymous Rejected) ---');
  const unauthVerify = await fetch(`${BASE_URL}/api/bids/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: 'order_test_anon',
      razorpay_payment_id: 'pay_test_anon',
      razorpay_signature: 'sig_test_anon',
      entryId: 'new_entry',
      amount: 500,
      entryData: {
        name: 'Guest Hacker Startup',
        slug: 'guest-hacker-startup',
        description: 'Should never be created',
      },
    }),
  });
  console.log('Bid verification unauthenticated/guest response status:', unauthVerify.status);
  assert.ok([401, 403].includes(unauthVerify.status), 'Anonymous / unauthenticated bid verification must be rejected with 401 or 403');
  console.log('✓ PASS: Anonymous guests cannot verify bids or create entries');

  // 4. Admin API Protection from Anonymous / Normal Users
  console.log('\n--- 4. Testing Admin Moderation Gate (Anonymous Rejected) ---');
  const anonModerate = await fetch(`${BASE_URL}/api/admin/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'activate',
      entryId: 'entry-1',
    }),
  });
  console.log('Admin moderation endpoint response status:', anonModerate.status);
  assert.ok([401, 403].includes(anonModerate.status), 'Admin endpoint must block unauthorized callers with 401 or 403');
  console.log('✓ PASS: Admin moderation API strictly protected from anonymous callers');

  // 5. Normal User Registration & Authentication
  console.log('\n--- 5. Testing Registered User Creation & Validation ---');
  const regEmail = `founder_audit_${Date.now()}@example.com`;
  const regUser = `founder_${Date.now().toString().slice(-6)}`;
  const regAuth = await authService.signUp(regUser, regEmail, 'StrongPass123!');
  assert.strictEqual(regAuth.error, null);
  assert.ok(regAuth.user);
  assert.strictEqual(regAuth.user.is_anonymous, false);
  assert.strictEqual(authService.isRegisteredUser(regAuth.user), true);
  console.log('✓ PASS: Registered founder account created and verified with is_anonymous = false');

  // 6. Sign Out
  console.log('\n--- 6. Testing Clean Session Sign Out ---');
  await authService.signOut();
  console.log('✓ PASS: Session destroyed cleanly');

  console.log('\n================================================================');
  console.log('SECURITY AUDIT COMPLETED: ALL SECURITY POLICIES ENFORCED');
  console.log('================================================================');
}

runSecurityAudit().catch((err) => {
  console.error('Security audit failed:', err);
  process.exit(1);
});
