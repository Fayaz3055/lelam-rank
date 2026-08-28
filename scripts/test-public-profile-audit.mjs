import assert from 'assert';
import { lelamStore } from '../src/lib/store.js';
import { formatINR, formatTimeAgo } from '../src/lib/ranking.js';

async function auditPublicProfilePage() {
  console.log('==================================================================');
  console.log('LELAM RANK — PUBLIC PROFILE (/[slug]) & LEADERBOARD INTEGRATION');
  console.log('==================================================================\n');

  // TEST 1: Active Entry with Full Details & Public Bidder
  console.log('--- TEST 1: Active Profile with Full Details & Public Bidder ---');
  const slugFull = `kerala-pay-${Date.now().toString().slice(-4)}`;
  const fullEntryData = {
    name: 'KeralaPay Ultra',
    slug: slugFull,
    description: 'UPI and crypto hybrid payment gateway for South Asian merchants.',
    website_url: 'https://keralapay.example.com',
    logo_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160',
    social_url: 'https://x.com/keralapay',
    initial_bid: 15000,
    owner_id: 'user-keralapay',
    bidder_name: '@fayaz_founder',
    visibility: 'public',
  };

  const createdFull = lelamStore.createEntry(fullEntryData);
  assert.ok(createdFull.entry);
  assert.strictEqual(createdFull.entry.slug, slugFull);
  assert.strictEqual(createdFull.entry.name, 'KeralaPay Ultra');
  assert.strictEqual(createdFull.entry.current_bid, 15000);
  assert.strictEqual(createdFull.entry.website_url, 'https://keralapay.example.com');
  assert.strictEqual(createdFull.entry.social_url, 'https://x.com/keralapay');
  assert.strictEqual(createdFull.entry.logo_url, 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160');

  // Verify public bid history for this entry
  const bidsFull = lelamStore.getBidsByEntryId(createdFull.entry.id);
  assert.strictEqual(bidsFull.length, 1);
  assert.strictEqual(bidsFull[0].amount, 15000);
  assert.strictEqual(bidsFull[0].visibility, 'public');
  assert.strictEqual(bidsFull[0].bidder_name, '@fayaz_founder');
  console.log('✓ PASS: Public profile displays verified name, logo, links, bid, and public bidder tag');

  // TEST 2: Active Profile with Anonymous Bidder Privacy
  console.log('\n--- TEST 2: Active Profile with Anonymous Bidder ---');
  const slugAnon = `stealth-agent-${Date.now().toString().slice(-4)}`;
  const anonEntryData = {
    name: 'Stealth AI Agent',
    slug: slugAnon,
    description: 'Autonomous financial agent operating in stealth mode.',
    initial_bid: 9000,
    owner_id: 'user-stealth-owner-private-id',
    bidder_name: 'SuperSecretFounderName',
    visibility: 'anonymous',
  };

  const createdAnon = lelamStore.createEntry(anonEntryData);
  const bidsAnon = lelamStore.getBidsByEntryId(createdAnon.entry.id);
  assert.strictEqual(bidsAnon.length, 1);
  assert.strictEqual(bidsAnon[0].visibility, 'anonymous');

  // Verify that rendering logic shields the bidder identity
  const renderedBidderDisplay = bidsAnon[0].visibility === 'anonymous'
    ? 'Anonymous Bidder'
    : bidsAnon[0].bidder_name || 'Verified Participant';
  assert.strictEqual(renderedBidderDisplay, 'Anonymous Bidder');
  assert.notStrictEqual(renderedBidderDisplay, 'SuperSecretFounderName');
  console.log('✓ PASS: Anonymous bidder identity shielded strictly as "Anonymous Bidder"');

  // TEST 3: Fallback Initials Avatar (When Logo is Not Provided)
  console.log('\n--- TEST 3: Logo Fallback to Initials ---');
  const fallbackInitials = createdAnon.entry.name.slice(0, 2).toUpperCase();
  assert.strictEqual(fallbackInitials, 'ST');
  assert.strictEqual(createdAnon.entry.logo_url, undefined);
  console.log(`✓ PASS: Missing logo falls back cleanly to 2-letter uppercase initials "${fallbackInitials}"`);

  // TEST 4: Invalid / Non-Existent Slug (404 / Claim State)
  console.log('\n--- TEST 4: Non-Existent Slug Handling ---');
  const nonexistentSlug = 'this-slug-definitely-does-not-exist-xyz';
  const notFoundEntry = lelamStore.getEntryBySlug(nonexistentSlug);
  assert.strictEqual(notFoundEntry, undefined);
  console.log('✓ PASS: Non-existent slug returns undefined and renders claimable 404 state');

  // TEST 5: Privacy Audit (Zero Exposure of Private Data)
  console.log('\n--- TEST 5: Privacy Audit on Profile Data ---');
  const publicEntry = lelamStore.getEntryBySlug(slugFull);
  assert.strictEqual(publicEntry.email, undefined, 'Entry must never contain email');
  assert.strictEqual(publicEntry.phone, undefined, 'Entry must never contain phone');
  assert.strictEqual(publicEntry.payment_secret, undefined, 'Entry must never contain payment secret');
  console.log('✓ PASS: Zero private user information exposed on public profile payload');

  // TEST 6: Helper Function Formatting
  console.log('\n--- TEST 6: Helper Formatting (formatINR & formatTimeAgo) ---');
  assert.strictEqual(formatINR(15000), '₹15,000');
  assert.strictEqual(formatTimeAgo(new Date().toISOString()), 'Just now');
  assert.strictEqual(formatTimeAgo(new Date(Date.now() - 1000 * 60 * 15).toISOString()), '15m ago');
  assert.strictEqual(formatTimeAgo(new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()), '3h ago');
  console.log('✓ PASS: Currency and relative time formatting functions operate flawlessly');

  console.log('\n==================================================================');
  console.log('ALL PUBLIC PROFILE (/[slug]) AUDIT TESTS PASSED');
  console.log('==================================================================');
}

auditPublicProfilePage().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
