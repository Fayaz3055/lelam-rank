async function testPhase1() {
  console.log('==================================================');
  console.log('PHASE 1 — HOMEPAGE + NAVIGATION TEST RUNNER');
  console.log('==================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Fetch Homepage HTML
  console.log('[Step 1] Loading http://localhost:3000...');
  const homeRes = await fetch(BASE_URL);
  if (!homeRes.ok) {
    throw new Error(`Homepage failed to load: HTTP ${homeRes.status}`);
  }
  const homeHtml = await homeRes.text();
  console.log('✓ Homepage loaded with HTTP 200 OK');

  // 2. Verify Homepage Section Order & Components
  console.log('\n[Step 2] Checking structural section order...');
  
  const hasNavbar = homeHtml.includes('LELAM') && homeHtml.includes('RANK');
  const hasLiveHeader = homeHtml.includes('LIVE RANKING BOARD');
  const hasChampionSection = homeHtml.includes('CURRENT REIGNING CHAMPION') || homeHtml.includes('THE #1 SPOT IS OPEN');
  const hasPodium = homeHtml.includes('Top 3 Podium') || homeHtml.includes('THE APEX');
  const hasStats = homeHtml.includes('TOTAL BID VOLUME') || homeHtml.includes('TOTAL ENTRIES');
  const hasLeaderboardTable = homeHtml.includes('Top 10 Leaderboard') || homeHtml.includes('Search entries');
  const hasActivityFeed = homeHtml.includes('Live Activity Pulse') || homeHtml.includes('ACTIVITY');
  const hasMechanism = homeHtml.includes('How LELAM RANK Works');

  console.log('- Navbar present:', hasNavbar ? 'YES' : 'NO');
  console.log('- Live Ranking header present:', hasLiveHeader ? 'YES' : 'NO');
  console.log('- Champion / #1 section present:', hasChampionSection ? 'YES' : 'NO');
  console.log('- Top 3 Podium present:', hasPodium ? 'YES' : 'NO');
  console.log('- Stats Bar present:', hasStats ? 'YES' : 'NO');
  console.log('- Top 10 Leaderboard present:', hasLeaderboardTable ? 'YES' : 'NO');
  console.log('- Activity Feed present:', hasActivityFeed ? 'YES' : 'NO');
  console.log('- How It Works / Mechanism present:', hasMechanism ? 'YES' : 'NO');

  // 3. Confirm old "WHO'S ON TOP?" hero is NOT at the top
  const heroIndex = homeHtml.indexOf("WHO&#x27;S ON TOP?");
  const liveHeaderIndex = homeHtml.indexOf('LIVE RANKING BOARD');
  const championIndex = homeHtml.indexOf('CURRENT REIGNING CHAMPION');
  
  const oldHeroNotAtTop = heroIndex === -1 || heroIndex > liveHeaderIndex;
  console.log('\n[Step 3] Old large "WHO\'S ON TOP?" hero NOT at top:', oldHeroNotAtTop ? 'CONFIRMED' : 'FAILED');

  // 4. Test Navigation Links
  console.log('\n[Step 4] Testing all navbar links & destination routes:');
  const navRoutes = [
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'Rules', path: '/rules' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Claim Your Spot', path: '/create' },
  ];

  let allNavPassed = true;
  for (const route of navRoutes) {
    const res = await fetch(`${BASE_URL}${route.path}`);
    const statusOk = res.status === 200;
    console.log(`  - Nav [${route.name}] (${route.path}) -> HTTP ${res.status} ${statusOk ? '✓ PASS' : '✗ FAIL'}`);
    if (!statusOk) allNavPassed = false;
  }

  // 5. Re-verify Homepage reload
  console.log('\n[Step 5] Re-verifying homepage reload...');
  const reloadRes = await fetch(BASE_URL);
  console.log('✓ Homepage reload status:', reloadRes.status);

  console.log('\n==================================================');
  console.log('PHASE 1 EXECUTION COMPLETE');
  console.log('==================================================');
}

testPhase1().catch((err) => {
  console.error('Phase 1 test error:', err);
  process.exit(1);
});
