async function verifyLiveProduction() {
  const BASE_URL = 'https://lelam-rank.vercel.app';
  console.log('==================================================');
  console.log(`VERIFYING LIVE VERCEL PRODUCTION DEPLOYMENT: ${BASE_URL}`);
  console.log('==================================================\n');

  // 1. Test homepage /
  try {
    const resHome = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
    console.log(`1. GET / -> Status: ${resHome.status}`);
  } catch (err) {
    console.log(`1. GET / -> Fetch error: ${err.message}`);
  }

  // 2. Test /leaderboard redirect
  try {
    const resLeaderboard = await fetch(`${BASE_URL}/leaderboard`, { redirect: 'manual' });
    const location = resLeaderboard.headers.get('location');
    console.log(`2. GET /leaderboard -> Status: ${resLeaderboard.status} (Redirect to: ${location || 'n/a'})`);
  } catch (err) {
    console.log(`2. GET /leaderboard -> Fetch error: ${err.message}`);
  }

  // 3. Test /admin/login
  try {
    const resAdminLogin = await fetch(`${BASE_URL}/admin/login`, { redirect: 'manual' });
    console.log(`3. GET /admin/login -> Status: ${resAdminLogin.status}`);
  } catch (err) {
    console.log(`3. GET /admin/login -> Fetch error: ${err.message}`);
  }

  // 4. Test /api/admin/data (Must reject unauthorized requests with 401)
  try {
    const resAdminData = await fetch(`${BASE_URL}/api/admin/data`);
    console.log(`4. GET /api/admin/data (Unauthenticated) -> Status: ${resAdminData.status}`);
  } catch (err) {
    console.log(`4. GET /api/admin/data -> Fetch error: ${err.message}`);
  }

  // 5. Test /api/admin/moderate (Must reject unauthorized requests with 403)
  try {
    const resAdminModerate = await fetch(`${BASE_URL}/api/admin/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: 'test-id', action: 'suspend' }),
    });
    console.log(`5. POST /api/admin/moderate (Unauthorized) -> Status: ${resAdminModerate.status}`);
  } catch (err) {
    console.log(`5. POST /api/admin/moderate -> Fetch error: ${err.message}`);
  }

  // 6. Test /api/bids/create-order (Must reject unauthenticated with 401)
  try {
    const resCreateOrder = await fetch(`${BASE_URL}/api/bids/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100, entryName: 'Test' }),
    });
    console.log(`6. POST /api/bids/create-order (Unauthenticated) -> Status: ${resCreateOrder.status}`);
  } catch (err) {
    console.log(`6. POST /api/bids/create-order -> Fetch error: ${err.message}`);
  }

  console.log('\n==================================================');
  console.log('LIVE PRODUCTION SMOKE TEST COMPLETE');
  console.log('==================================================');
}

verifyLiveProduction();
