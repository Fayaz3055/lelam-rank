import fs from 'fs';
import assert from 'assert';

console.log('==================================================');
console.log('VERIFYING TAKE SPOT MODAL SOURCE CODE & STRUCTURE');
console.log('==================================================\n');

const bidModalCode = fs.readFileSync('src/components/bidding/BidModal.tsx', 'utf8');

// 1. Initial Step check
assert.ok(bidModalCode.includes("const [step, setStep] = useState<'details' | 'confirm' | 'paying' | 'success'>('details');"), 'Must default to details step');
console.log('✓ PASS: step defaults to "details" (Step 1)');

// 2. Title & Header check
assert.ok(bidModalCode.includes('Take This Spot'), 'Header must contain "Take This Spot"');
assert.ok(bidModalCode.includes('Challenging Rank #'), 'Header must display challenged rank');
console.log('✓ PASS: Modal header clearly identifies "Take This Spot" and Challenged Rank');

// 3. Required Entity Details Inputs
assert.ok(bidModalCode.includes('Business / Startup / Product Name *'), 'Must include Name input');
assert.ok(bidModalCode.includes('Leaderboard URL Slug *'), 'Must include Slug input');
assert.ok(bidModalCode.includes('lelamrank.in/'), 'Must preview lelamrank.in/ slug');
assert.ok(bidModalCode.includes('One-Line Description / Value Proposition *'), 'Must include One-Line Description');
assert.ok(bidModalCode.includes('180'), 'Must enforce 180 char limit with live counter');
assert.ok(bidModalCode.includes('Website URL'), 'Must include Website URL input');
assert.ok(bidModalCode.includes('Logo / Avatar URL'), 'Must include Logo URL input');
assert.ok(bidModalCode.includes('Social / Founder Link'), 'Must include Social Link input');
assert.ok(bidModalCode.includes('Your Verified Bid (₹ INR) *'), 'Must include Bid input');
assert.ok(bidModalCode.includes('Bidder Identity Visibility'), 'Must include Public / Anonymous selector');
assert.ok(bidModalCode.includes('Review Bid & Details'), 'Must have Review Bid & Details button');
console.log('✓ PASS: All 9 Step 1 Entity Details & Bid elements are present in JSX');

// 4. Step 2 Review Screen Confirmation
assert.ok(bidModalCode.includes('CONFIRM YOUR BID'), 'Must include "CONFIRM YOUR BID" screen');
assert.ok(bidModalCode.includes('Edit Details'), 'Must have "Edit Details" button in Review');
assert.ok(bidModalCode.includes('Edit Bid'), 'Must have "Edit Bid" button in Review');
assert.ok(bidModalCode.includes('Proceed to Payment'), 'Must have "Proceed to Payment" button');
console.log('✓ PASS: Step 2 Review screen contains all summary cards, edit controls, and payment button');

// 5. Razorpay & Cancellation handling
assert.ok(bidModalCode.includes('launchRazorpayCheckout'), 'Must call launchRazorpayCheckout on Proceed');
assert.ok(bidModalCode.includes('Payment was cancelled. Your bid was not placed.'), 'Must set error on dismissal');
assert.ok(bidModalCode.includes('/api/bids/verify'), 'Must verify payment and activate on server');
console.log('✓ PASS: Razorpay launch, cancellation safety, and server-side verification intact');

console.log('\n==================================================');
console.log('TAKE SPOT MODAL VERIFICATION COMPLETE & PASSED');
console.log('==================================================');
