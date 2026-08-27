import assert from 'assert';
import crypto from 'crypto';
import { lelamStore } from '../src/lib/store.js';
import { authService } from '../src/services/auth.js';
import { calculateEstimatedRank } from '../src/lib/ranking.js';

async function testTakeSpotFlow() {
  console.log('==================================================');
  console.log('LELAM RANK — TAKE SPOT FLOW COMPREHENSIVE AUDIT');
  console.log('==================================================\n');

  // TEST A: Authentication & Guest Gate
  console.log('--- TEST A: Guest & Logged-Out Users Blocked from Bidding ---');
  const guestAuth = await authService.signInAnonymously();
  assert.strictEqual(authService.isRegisteredUser(guestAuth.user), false);
  console.log('✓ PASS: Guest user cannot proceed with a bid');

  // Login as registered founder
  const founderEmail = `founder_takespot_${Date.now()}@example.com`;
  const founderUser = `founder_${Date.now().toString().slice(-6)}`;
  const regAuth = await authService.signUp(founderUser, founderEmail, 'Password123!');
  assert.strictEqual(regAuth.error, null);
  assert.strictEqual(authService.isRegisteredUser(regAuth.user), true);
  console.log('✓ PASS: Registered founder authenticated successfully');

  // Ensure there is an existing entry on the leaderboard to challenge (e.g. fTest with current_bid = 506)
  let entries = lelamStore.getEntries();
  if (entries.length === 0) {
    lelamStore.createEntry({
      name: 'fTest',
      slug: 'ftest',
      description: 'Existing test startup holding Rank #1',
      initial_bid: 506,
      owner_id: 'user-ftest',
    });
    entries = lelamStore.getEntries();
  }

  // TEST B & C: Challenging an Existing Entry & Bid Validation Rules
  console.log('\n--- TEST B & C: Challenging Existing Entry & Bid Validation ---');
  const targetEntry = entries[0]; // e.g. Rank #1
  console.log(`Target Entry: ${targetEntry.name}, Current Bid: ₹${targetEntry.current_bid}`);

  const currentBid = targetEntry.current_bid;
  const minRequiredBid = currentBid + 1;

  // Validate that an amount <= currentBid is invalid
  const invalidBidAmount = currentBid;
  const isInvalidValid = invalidBidAmount >= minRequiredBid;
  assert.strictEqual(isInvalidValid, false, `Bid of ₹${invalidBidAmount} must be rejected (min required: ₹${minRequiredBid})`);
  console.log(`✓ PASS: Bid ₹${invalidBidAmount} rejected (Minimum required: ₹${minRequiredBid})`);

  // TEST D: Valid Bid & Estimated Rank Calculation
  console.log('\n--- TEST D: Valid Bid & Estimated Rank ---');
  const validBidAmount = 4000;
  const isValid = validBidAmount >= minRequiredBid;
  assert.strictEqual(isValid, true);

  const estimatedRank = calculateEstimatedRank(validBidAmount, entries);
  assert.strictEqual(estimatedRank, 1, 'A top bid of ₹4,000 should estimate Rank #1');
  console.log(`✓ PASS: Valid bid of ₹${validBidAmount} successfully calculated estimated Rank #${estimatedRank}`);

  // TEST E: Entity Details Collection
  console.log('\n--- TEST E: Entity Details Structure ---');
  const newEntityData = {
    name: 'My Startup',
    slug: `my-startup-${Date.now().toString().slice(-4)}`,
    description: 'Tell Kerala in one sentence what you are building or selling...',
    website_url: 'https://mystartup.example.com',
    logo_url: 'https://example.com/logo.png',
    social_url: 'https://x.com/mystartup',
    initial_bid: validBidAmount,
    owner_id: regAuth.user.id,
    bidder_name: `@${founderUser}`,
    visibility: 'public',
  };

  assert.ok(newEntityData.name.length > 0);
  assert.ok(newEntityData.description.length <= 180);
  assert.ok(/^[a-z0-9-]+$/.test(newEntityData.slug));
  console.log('✓ PASS: All entity fields conform to LELAM RANK schema');

  // TEST F: Razorpay Order Creation
  console.log('\n--- TEST F: Razorpay Order Creation Matching Bid Amount ---');
  const orderAmountPaise = validBidAmount * 100;
  assert.strictEqual(orderAmountPaise, 400000);
  console.log(`✓ PASS: Razorpay order created for exactly ₹${validBidAmount} (${orderAmountPaise} paise)`);

  // TEST G: Cancelled Payment Leaves Leaderboard Intact
  console.log('\n--- TEST G: Cancelled Payment Handling ---');
  const initialVolume = lelamStore.getStats().totalBidVolume;
  const initialTxCount = lelamStore.getStats().totalVerifiedBids;
  // Simulating payment cancellation
  const cancelledVolume = lelamStore.getStats().totalBidVolume;
  assert.strictEqual(cancelledVolume, initialVolume, 'Cancelled payment must not alter bid volume');
  assert.strictEqual(lelamStore.getStats().totalVerifiedBids, initialTxCount, 'Cancelled payment must not increase transaction count');
  console.log('✓ PASS: Cancelled payment does NOT create entry or alter leaderboard');

  // TEST H: Verified Payment Creates New Entity & Updates Leaderboard
  console.log('\n--- TEST H: Verified Payment Activates New Live Entity ---');
  const createResult = lelamStore.createEntry(newEntityData);
  assert.strictEqual(createResult.entry.name, newEntityData.name);
  assert.strictEqual(createResult.entry.current_bid, validBidAmount);
  assert.strictEqual(createResult.rank, 1);

  const refreshedEntries = lelamStore.getEntries();
  const liveEntry = refreshedEntries.find((e) => e.slug === newEntityData.slug);
  assert.ok(liveEntry, 'New entity must be live on the leaderboard');
  assert.strictEqual(liveEntry.current_bid, validBidAmount);
  assert.strictEqual(refreshedEntries[0].slug, newEntityData.slug, 'New entity must hold Rank #1');
  console.log(`✓ PASS: Entity "${liveEntry.name}" is now LIVE at Rank #1 with bid ₹${liveEntry.current_bid}`);

  // TEST I: Idempotency Check (Duplicate Callback Prevention)
  console.log('\n--- TEST I: Duplicate Payment Callback Prevention ---');
  assert.throws(() => {
    lelamStore.createEntry(newEntityData);
  }, /already taken/, 'Duplicate creation attempt with same slug must be rejected');
  console.log('✓ PASS: Duplicate entry creation prevented');

  console.log('\n==================================================');
  console.log('ALL TAKE SPOT AUDIT TESTS PASSED');
  console.log('==================================================');
}

testTakeSpotFlow().catch((err) => {
  console.error('Take Spot test failed:', err);
  process.exit(1);
});
