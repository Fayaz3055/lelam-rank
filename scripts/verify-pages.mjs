async function verifyPages() {
  const routes = [
    '/',
    '/leaderboard',
    '/kochi-robotics',
    '/spices-ai',
    '/rave-work',
    '/create',
    '/dashboard',
    '/how-it-works',
    '/about',
    '/rules',
    '/privacy',
    '/terms',
    '/refund-policy',
    '/admin',
    '/admin/login',
  ];

  console.log('Testing HTTP page routes...');
  for (const r of routes) {
    const res = await fetch(`http://localhost:3000${r}`);
    console.log(`Route [${r}] -> HTTP ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Failed route ${r}: status ${res.status}`);
    }
  }
  console.log('All 15 page routes rendered with HTTP 200 OK!');
}

verifyPages().catch((e) => {
  console.error(e);
  process.exit(1);
});
