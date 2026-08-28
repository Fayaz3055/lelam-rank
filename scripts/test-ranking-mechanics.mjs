import assert from 'assert';
import { sortLeaderboard, calculateEstimatedRank } from '../src/lib/ranking.js';

async function auditRankingMechanics() {
  console.log('================================================================');
  console.log('LELAM RANK — LEADERBOARD RANKING MECHANICS AUDIT');
  console.log('================================================================\n');

  // TEST 1: Higher Bids Rank Correctly
  console.log('--- TEST 1: Higher Bids Rank Correctly ---');
  const baseTime = 1700000000000;
  const initialTestEntries = [
    {
      id: 'entry-a',
      name: 'Entry A (Small)',
      slug: 'entry-a',
      description: 'Test A',
      status: 'active',
      current_bid: 1000,
      created_at: new Date(baseTime).toISOString(),
      updated_at: new Date(baseTime).toISOString(),
    },
    {
      id: 'entry-b',
      name: 'Entry B (Medium)',
      slug: 'entry-b',
      description: 'Test B',
      status: 'active',
      current_bid: 5000,
      created_at: new Date(baseTime + 1000).toISOString(),
      updated_at: new Date(baseTime + 1000).toISOString(),
    },
    {
      id: 'entry-c',
      name: 'Entry C (Large)',
      slug: 'entry-c',
      description: 'Test C',
      status: 'active',
      current_bid: 10000,
      created_at: new Date(baseTime + 2000).toISOString(),
      updated_at: new Date(baseTime + 2000).toISOString(),
    },
  ];

  let ranked = sortLeaderboard(initialTestEntries);
  assert.strictEqual(ranked[0].slug, 'entry-c', 'Rank #1 must be Entry C (₹10,000)');
  assert.strictEqual(ranked[0].current_rank, 1);
  assert.strictEqual(ranked[1].slug, 'entry-b', 'Rank #2 must be Entry B (₹5,000)');
  assert.strictEqual(ranked[1].current_rank, 2);
  assert.strictEqual(ranked[2].slug, 'entry-a', 'Rank #3 must be Entry A (₹1,000)');
  assert.strictEqual(ranked[2].current_rank, 3);
  console.log('✓ PASS: Higher bids rank correctly (₹10,000 > ₹5,000 > ₹1,000)');

  // TEST 2: Existing Entries Shift Down Correctly on New Top Bid
  console.log('\n--- TEST 2: Existing Entries Shift Down Correctly on New Top Bid ---');
  const entryD = {
    id: 'entry-d',
    name: 'Entry D (Champion Challenger)',
    slug: 'entry-d',
    description: 'Test D',
    status: 'active',
    current_bid: 20000,
    created_at: new Date(baseTime + 3000).toISOString(),
    updated_at: new Date(baseTime + 3000).toISOString(),
  };

  ranked = sortLeaderboard([...ranked, entryD]);
  assert.strictEqual(ranked[0].slug, 'entry-d', 'Rank #1 must be Entry D (₹20,000)');
  assert.strictEqual(ranked[1].slug, 'entry-c', 'Rank #2 must be Entry C (shifted from #1)');
  assert.strictEqual(ranked[2].slug, 'entry-b', 'Rank #3 must be Entry B (shifted from #2)');
  assert.strictEqual(ranked[3].slug, 'entry-a', 'Rank #4 must be Entry A (shifted from #3)');
  console.log('✓ PASS: All previous entries shifted down by exactly 1 position upon higher bid');

  // TEST 3: Interstitial Bid Placed Between Existing Rankings
  console.log('\n--- TEST 3: Interstitial Bid Between Existing Rankings ---');
  // Bid of ₹7,500 between Entry C (₹10,000) and Entry B (₹5,000)
  const entryE = {
    id: 'entry-e',
    name: 'Entry E (Middle Bidder)',
    slug: 'entry-e',
    description: 'Test E',
    status: 'active',
    current_bid: 7500,
    created_at: new Date(baseTime + 4000).toISOString(),
    updated_at: new Date(baseTime + 4000).toISOString(),
  };

  // Check pre-bid estimated rank calculation
  const estimatedRankE = calculateEstimatedRank(7500, ranked);
  assert.strictEqual(estimatedRankE, 3, 'Estimated rank for ₹7,500 must be #3');
  console.log(`✓ PASS: calculateEstimatedRank correctly predicted Rank #${estimatedRankE}`);

  ranked = sortLeaderboard([...ranked, entryE]);
  assert.strictEqual(ranked[0].slug, 'entry-d', 'Rank #1 must be ₹20,000');
  assert.strictEqual(ranked[1].slug, 'entry-c', 'Rank #2 must be ₹10,000');
  assert.strictEqual(ranked[2].slug, 'entry-e', 'Rank #3 must be ₹7,500 (interstitial insert)');
  assert.strictEqual(ranked[3].slug, 'entry-b', 'Rank #4 must be ₹5,000 (shifted from #3)');
  assert.strictEqual(ranked[4].slug, 'entry-a', 'Rank #5 must be ₹1,000 (shifted from #4)');
  console.log('✓ PASS: Interstitial bid slotted into exact middle position #3 and shifted subsequent entries');

  // TEST 4: Deterministic Equal-Bid Tie Handling (First to Bid Wins)
  console.log('\n--- TEST 4: Deterministic Equal-Bid Tie Handling ---');
  const tieTime1 = new Date('2026-08-27T10:00:00Z').toISOString();
  const tieTime2 = new Date('2026-08-27T10:05:00Z').toISOString(); // 5 minutes later

  const entryTieEarly = {
    id: 'tie-early',
    name: 'First to Bid ₹8,000',
    slug: 'tie-early',
    description: 'Earlier timestamp',
    status: 'active',
    current_bid: 8000,
    created_at: tieTime1,
    updated_at: tieTime1,
  };

  const entryTieLate = {
    id: 'tie-late',
    name: 'Second to Bid ₹8,000',
    slug: 'tie-late',
    description: 'Later timestamp',
    status: 'active',
    current_bid: 8000,
    created_at: tieTime2,
    updated_at: tieTime2,
  };

  const tieRanked = sortLeaderboard([entryTieLate, entryTieEarly]);
  assert.strictEqual(tieRanked[0].slug, 'tie-early', 'Earlier verified timestamp must win tie');
  assert.strictEqual(tieRanked[1].slug, 'tie-late', 'Later timestamp must take next rank');
  console.log('✓ PASS: Equal-bid tie resolved deterministically by earlier verified timestamp');

  // Tertiary tie breaker (same bid, same update time, earlier creation wins)
  const entryTertiary1 = {
    id: 'tert-1',
    name: 'Created First',
    slug: 'tert-1',
    description: 'Created Earlier',
    status: 'active',
    current_bid: 8000,
    created_at: tieTime1,
    updated_at: tieTime2,
  };

  const entryTertiary2 = {
    id: 'tert-2',
    name: 'Created Second',
    slug: 'tert-2',
    description: 'Created Later',
    status: 'active',
    current_bid: 8000,
    created_at: tieTime2,
    updated_at: tieTime2,
  };

  const tertRanked = sortLeaderboard([entryTertiary2, entryTertiary1]);
  assert.strictEqual(tertRanked[0].slug, 'tert-1', 'Earlier created_at must win tertiary tie');
  console.log('✓ PASS: Equal-bid tertiary tie resolved deterministically by creation date');

  // TEST 5: Bid Volume & Statistics
  console.log('\n--- TEST 5: Bid Volume & Statistics Aggregation ---');
  const allCurrentBids = ranked.map((e) => e.current_bid);
  const totalVolume = allCurrentBids.reduce((sum, b) => sum + b, 0);
  assert.strictEqual(totalVolume, 20000 + 10000 + 7500 + 5000 + 1000);
  assert.strictEqual(totalVolume, 43500);
  assert.strictEqual(ranked.length, 5);
  console.log(`✓ PASS: Total bid volume calculated accurately: ₹${totalVolume.toLocaleString('en-IN')}`);

  // TEST 6: Shuffled Recalculation & Refresh Determinism
  console.log('\n--- TEST 6: Recalculation & State Refresh Determinism ---');
  const baselineOrder = ranked.map((e) => e.slug).join(',');
  for (let i = 0; i < 50; i++) {
    const shuffled = [...ranked].sort(() => Math.random() - 0.5);
    const reSorted = sortLeaderboard(shuffled);
    const newOrder = reSorted.map((e) => e.slug).join(',');
    assert.strictEqual(newOrder, baselineOrder, `Shuffled trial #${i + 1} produced non-deterministic order`);
  }
  console.log('✓ PASS: 50/50 randomized shuffle recalculations produced 100% identical deterministic ranking');

  console.log('\n================================================================');
  console.log('ALL LEADERBOARD RANKING MECHANICS AUDIT TESTS PASSED');
  console.log('================================================================');
}

auditRankingMechanics().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
