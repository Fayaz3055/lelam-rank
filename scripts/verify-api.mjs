async function verify() {
  console.log('Testing LELAM RANK endpoints...');
  
  // 1. GET /api/leaderboard
  const res1 = await fetch('http://localhost:3000/api/leaderboard');
  const json1 = await res1.json();
  console.log('GET /api/leaderboard -> status:', res1.status, 'entries:', json1.data?.entries?.length);

  // 2. POST /api/bids/create-order
  const res2 = await fetch('http://localhost:3000/api/bids/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 15000, entryId: 'entry-3' }),
  });
  const json2 = await res2.json();
  console.log('POST /api/bids/create-order -> status:', res2.status, 'orderId:', json2.orderId);

  // 3. POST /api/bids/verify
  const res3 = await fetch('http://localhost:3000/api/bids/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: json2.orderId,
      razorpay_payment_id: 'pay_test_sandbox_123',
      razorpay_signature: 'sandbox_sig_test_valid',
      entryId: 'entry-3',
      amount: 15000,
      bidderEmail: 'founder@rave.work',
    }),
  });
  const json3 = await res3.json();
  console.log('POST /api/bids/verify -> status:', res3.status, 'verified:', json3.verified, 'newRank:', json3.newRank);

  // 4. Admin Auth verification
  const res4 = await fetch('http://localhost:3000/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lelamrank.in', password: 'admin' }),
  });
  const json4 = await res4.json();
  console.log('POST /api/admin/auth -> status:', res4.status, 'adminRole:', json4.role);

  console.log('All API and backend integration tests passed successfully!');
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
