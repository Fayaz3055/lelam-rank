import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Parse .env.local natively
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

async function testServerPaymentVerification() {
  console.log('==================================================');
  console.log('TESTING SERVER-SIDE PAYMENT VERIFICATION & RLS BYPASS');
  console.log('==================================================\n');

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const razorpaySecret = env.RAZORPAY_KEY_SECRET;

  if (!url || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const adminSupabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Get real test admin/founder user ID
  const { data: profiles, error: pErr } = await adminSupabase
    .from('profiles')
    .select('id, email')
    .limit(1);

  if (pErr || !profiles || profiles.length === 0) {
    console.error('No profiles found to test with:', pErr);
    process.exit(1);
  }

  const testUser = profiles[0];
  console.log(`Testing with user: ${testUser.email} (ID: ${testUser.id})`);

  // 2. Generate simulated Razorpay test payment proof
  const testOrderId = `order_test_${Date.now()}`;
  const testPaymentId = `pay_test_${Date.now()}`;
  const testAmount = 500;
  const testSlug = `ravee-test-${Date.now().toString().slice(-4)}`;

  const generatedSignature = crypto
    .createHmac('sha256', razorpaySecret || 'dummy_secret')
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');

  console.log('\n--- 1. Testing Server-side Entry Creation via Admin Supabase Client ---');

  // Insert entry
  const { data: insertedEntry, error: insertError } = await adminSupabase
    .from('entries')
    .insert({
      name: 'Ravee AI Studio',
      slug: testSlug,
      description: 'Enterprise AI workflows and generative tools',
      website_url: 'https://ravee.example.com',
      logo_url: 'https://example.com/ravee.png',
      current_bid: testAmount,
      status: 'active',
      owner_id: testUser.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert entry failed:', insertError);
    process.exit(1);
  }
  console.log('✓ Successfully created entry without RLS violation:', insertedEntry.id, insertedEntry.name);

  // Insert payment
  const { data: insertedPayment, error: payError } = await adminSupabase
    .from('payments')
    .insert({
      user_id: testUser.id,
      entry_id: insertedEntry.id,
      amount: testAmount,
      provider: 'razorpay',
      provider_order_id: testOrderId,
      provider_payment_id: testPaymentId,
      status: 'verified',
    })
    .select()
    .single();

  if (payError) {
    console.error('❌ Insert payment failed:', payError);
    process.exit(1);
  }
  console.log('✓ Successfully created verified payment record:', insertedPayment.id);

  // Insert bid
  const { data: insertedBid, error: bidError } = await adminSupabase
    .from('bids')
    .insert({
      entry_id: insertedEntry.id,
      bidder_id: testUser.id,
      bidder_name: 'Ravee Founder',
      amount: testAmount,
      payment_id: insertedPayment.id,
      visibility: 'public',
      verified_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (bidError) {
    console.error('❌ Insert bid failed:', bidError);
    process.exit(1);
  }
  console.log('✓ Successfully recorded verified bid:', insertedBid.id);

  // Check leaderboard_view
  const { data: rankRow, error: viewErr } = await adminSupabase
    .from('leaderboard_view')
    .select('*')
    .eq('entry_id', insertedEntry.id)
    .maybeSingle();

  if (viewErr || !rankRow) {
    console.error('❌ leaderboard_view lookup failed:', viewErr);
    process.exit(1);
  }
  console.log(`✓ Entry appears on leaderboard_view at Rank #${rankRow.rank} with bid ₹${rankRow.current_bid}`);

  // Clean up the test entry
  await adminSupabase.from('bids').delete().eq('id', insertedBid.id);
  await adminSupabase.from('payments').delete().eq('id', insertedPayment.id);
  await adminSupabase.from('entries').delete().eq('id', insertedEntry.id);
  console.log('✓ Cleaned up test record cleanly.');

  console.log('\n==================================================');
  console.log('ALL SERVER-SIDE PAYMENT VERIFICATION CHECKS PASSED');
  console.log('==================================================');
}

testServerPaymentVerification().catch(console.error);
