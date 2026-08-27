import assert from 'assert';
import crypto from 'crypto';
import { verifyRazorpaySignature } from '../src/lib/razorpay.js';

async function testRealRazorpayFlow() {
  console.log('==================================================');
  console.log('REAL RAZORPAY TEST MODE PAYMENT FLOW AUDIT');
  console.log('==================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Test Server-Side Auth Gate on Order Creation
  console.log('--- 1. Testing Server-Side Auth Gate on Order Creation ---');
  const orderRes = await fetch(`${BASE_URL}/api/bids/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 500, // ₹500
      entryId: 'new_entry',
      entryName: 'LELAM Test Entry',
    }),
  });

  console.log('Create order unauthenticated status:', orderRes.status);
  const orderData = await orderRes.json();
  console.log('Create order response message:', orderData.error);
  assert.strictEqual(orderRes.status, 401, 'Unauthenticated order creation must be rejected with 401');
  console.log('✓ PASS: Server-side authentication gate blocks unauthenticated order creation');

  // 2. Test Server-Side Auth Gate on Bid Verification
  console.log('\n--- 2. Testing Server-Side Auth Gate on Bid Verification ---');
  const unauthVerify = await fetch(`${BASE_URL}/api/bids/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: 'order_test_123',
      razorpay_payment_id: 'pay_test_456',
      razorpay_signature: 'fake_forged_signature_abc',
      entryId: 'new_entry',
      amount: 500,
    }),
  });

  console.log('Verification unauthenticated status:', unauthVerify.status);
  assert.strictEqual(unauthVerify.status, 401, 'Unauthenticated bid verification must be rejected with 401');
  console.log('✓ PASS: Server-side authentication gate blocks unauthenticated verification');

  // 3. Test HMAC SHA256 Signature Verification Engine
  console.log('\n--- 3. Testing HMAC SHA256 Signature Verification Algorithm ---');
  const secret = 'rzp_test_secret_key_12345';
  const orderId = `order_${Date.now()}`;
  const paymentId = `pay_${Date.now()}`;

  // Authentic Signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${orderId}|${paymentId}`);
  const validSignature = hmac.digest('hex');

  const isSignatureValid = verifyRazorpaySignature(orderId, paymentId, validSignature, secret);
  console.log('Authentic signature validation result:', isSignatureValid);
  assert.strictEqual(isSignatureValid, true, 'Valid signature must return true');

  // Forged Signature
  const isForgedValid = verifyRazorpaySignature(orderId, paymentId, 'forged_fake_signature_abc', secret);
  console.log('Forged signature validation result:', isForgedValid);
  assert.strictEqual(isForgedValid, false, 'Forged signature must return false');

  // Mock / Sandbox string bypass attempt
  const isMockBypassValid = verifyRazorpaySignature(orderId, paymentId, 'sandbox_sig_valid', secret);
  console.log('Mock "sandbox_sig_valid" string bypass attempt result:', isMockBypassValid);
  assert.strictEqual(isMockBypassValid, false, 'Mock bypass must return false (no bypass allowed)');

  console.log('✓ PASS: HMAC SHA256 signature verification strictly enforced');

  console.log('\n==================================================');
  console.log('ALL RAZORPAY PAYMENT FLOW ASSERTIONS PASSED');
  console.log('==================================================');
}

testRealRazorpayFlow().catch((err) => {
  console.error('Razorpay test failed:', err);
  process.exit(1);
});
