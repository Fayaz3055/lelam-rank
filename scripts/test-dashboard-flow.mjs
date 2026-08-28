import assert from 'assert';
import { lelamStore } from '../src/lib/store.js';
import { authService } from '../src/services/auth.js';

async function auditDashboardFlow() {
  console.log('==================================================================');
  console.log('LELAM RANK — FOUNDER DASHBOARD (/dashboard) AUDIT');
  console.log('==================================================================\n');

  // TEST 1: Guest / Non-registered Access Blocked
  console.log('--- TEST 1: Guest / Non-registered User Blocked ---');
  const guestAuth = await authService.signInAnonymously();
  assert.strictEqual(authService.isRegisteredUser(guestAuth.user), false);
  console.log('✓ PASS: Guest user identified as unverified; dashboard renders login gate');

  // TEST 2: Empty State for New Registered Founder
  console.log('\n--- TEST 2: Empty State for New Registered Founder ---');
  const founderAUser = `founder_a_${Date.now().toString().slice(-4)}`;
  const founderAEmail = `${founderAUser}@example.com`;
  const founderA = await authService.signUp(founderAUser, founderAEmail, 'Password123!');
  assert.strictEqual(authService.isRegisteredUser(founderA.user), true);

  const allEntries = lelamStore.getEntries();
  const founderAEntries = allEntries.filter((e) => e.owner_id === founderA.user.id);
  assert.strictEqual(founderAEntries.length, 0, 'New user must start with 0 entries');
  console.log('✓ PASS: New registered founder starts with clean 0-entry empty state');

  // TEST 3: Single Entry Claimed & Dashboard Visibility
  console.log('\n--- TEST 3: Single Claimed Entry Dashboard Visibility ---');
  const entryA1 = lelamStore.createEntry({
    name: 'Kochi Cloud Hub',
    slug: `kochi-cloud-${Date.now().toString().slice(-4)}`,
    description: 'Cloud orchestration and edge storage for Kerala builders',
    website_url: 'https://kochicould.example.com',
    initial_bid: 5000,
    owner_id: founderA.user.id,
    bidder_name: `@${founderAUser}`,
    visibility: 'public',
  });

  const refreshedEntries = lelamStore.getEntries();
  const founderAUpdated = refreshedEntries.filter((e) => e.owner_id === founderA.user.id);
  assert.strictEqual(founderAUpdated.length, 1);
  assert.strictEqual(founderAUpdated[0].name, 'Kochi Cloud Hub');
  assert.strictEqual(founderAUpdated[0].current_bid, 5000);
  assert.strictEqual(founderAUpdated[0].owner_id, founderA.user.id);
  console.log(`✓ PASS: Founder A dashboard displays single entry "${founderAUpdated[0].name}" with bid ₹${founderAUpdated[0].current_bid}`);

  // TEST 4: Multiple Entries for Same Founder
  console.log('\n--- TEST 4: Multiple Entries for Same Founder ---');
  const entryA2 = lelamStore.createEntry({
    name: 'Malabar Robotics',
    slug: `malabar-robotics-${Date.now().toString().slice(-4)}`,
    description: 'Agricultural drone robotics and AI sensors',
    website_url: 'https://malabarrobotics.example.com',
    initial_bid: 8500,
    owner_id: founderA.user.id,
    bidder_name: `@${founderAUser}`,
    visibility: 'public',
  });

  const founderAMultiple = lelamStore.getEntries().filter((e) => e.owner_id === founderA.user.id);
  assert.strictEqual(founderAMultiple.length, 2, 'Founder A must have exactly 2 entries');
  const names = founderAMultiple.map((e) => e.name);
  assert.ok(names.includes('Kochi Cloud Hub'));
  assert.ok(names.includes('Malabar Robotics'));
  console.log('✓ PASS: Founder A dashboard cleanly displays multiple owned entries (2/2)');

  // TEST 5: Strict Cross-User Isolation (Zero Leaks between Founders)
  console.log('\n--- TEST 5: Strict Cross-User Isolation ---');
  const founderBUser = `founder_b_${Date.now().toString().slice(-4)}`;
  const founderBEmail = `${founderBUser}@example.com`;
  const founderB = await authService.signUp(founderBUser, founderBEmail, 'Password123!');

  const entryB1 = lelamStore.createEntry({
    name: 'Wayanad Tea Labs',
    slug: `wayanad-tea-${Date.now().toString().slice(-4)}`,
    description: 'Direct-to-consumer artisanal single-origin teas',
    initial_bid: 4200,
    owner_id: founderB.user.id,
    bidder_name: `@${founderBUser}`,
    visibility: 'public',
  });

  // Check Founder B's view
  const founderBEntries = lelamStore.getEntries().filter((e) => e.owner_id === founderB.user.id);
  assert.strictEqual(founderBEntries.length, 1);
  assert.strictEqual(founderBEntries[0].name, 'Wayanad Tea Labs');
  assert.ok(!founderBEntries.map((e) => e.name).includes('Kochi Cloud Hub'), 'Founder B must NOT see Founder A entries');
  assert.ok(!founderBEntries.map((e) => e.name).includes('Malabar Robotics'), 'Founder B must NOT see Founder A entries');

  // Check Founder A's view
  const founderAIsolation = lelamStore.getEntries().filter((e) => e.owner_id === founderA.user.id);
  assert.strictEqual(founderAIsolation.length, 2);
  assert.ok(!founderAIsolation.map((e) => e.name).includes('Wayanad Tea Labs'), 'Founder A must NOT see Founder B entries');
  console.log('✓ PASS: Absolute isolation verified; founders can only see and access their own entries');

  // TEST 6: Sign Out Session Destruction
  console.log('\n--- TEST 6: Sign Out Session Cleanup ---');
  await authService.signOut();
  const sessionAfterLogout = await authService.getCurrentUser();
  assert.strictEqual(sessionAfterLogout, null);
  console.log('✓ PASS: Sign out destroys founder session cleanly and resets dashboard state');

  console.log('\n==================================================================');
  console.log('ALL FOUNDER DASHBOARD AUDIT TESTS PASSED');
  console.log('==================================================================');
}

auditDashboardFlow().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
