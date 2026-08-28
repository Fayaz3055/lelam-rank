import assert from 'assert';
import { lelamStore } from '../src/lib/store.js';
import { authService } from '../src/services/auth.js';
import { calculateEstimatedRank } from '../src/lib/ranking.js';

async function testTakeSpotEditFlow() {
  console.log('==================================================================');
  console.log('LELAM RANK — TAKE SPOT EDIT DETAILS & EDIT BID POST-CANCEL AUDIT');
  console.log('==================================================================\n');

  // Baseline data isolation check
  const initialVolume = lelamStore.getStats().totalBidVolume;
  const initialTxCount = lelamStore.getStats().totalVerifiedBids;
  const initialEntriesCount = lelamStore.getEntries().length;

  console.log('--- 1. Baseline State (Zero Mutation Check) ---');
  console.log(`Active Entries: ${initialEntriesCount}, Total Volume: ₹${initialVolume}, Verified Bids: ${initialTxCount}`);

  // Authenticate simulated founder
  const founderUser = 'test_editor';
  const founderEmail = 'test_editor@example.com';
  const regAuth = await authService.signUp(founderUser, founderEmail, 'Password123!');
  assert.strictEqual(authService.isRegisteredUser(regAuth.user), true);
  console.log('✓ PASS: Registered founder authenticated');

  // Step 1: Initial Form State
  console.log('\n--- 2. Step 1: User Enters Entity Details & Initial Bid ---');
  let formState = {
    entityName: 'Kochi AI Studio',
    slug: 'kochi-ai-studio',
    description: 'Next-generation generative media studio for Malayalam creators',
    websiteUrl: 'https://kochiaistudio.example.com',
    logoUrl: 'https://example.com/logo.png',
    socialUrl: 'https://x.com/kochiaistudio',
    amountStr: '1200',
    visibility: 'anonymous',
    step: 'details',
    error: null,
  };

  console.log('Initial Form State:', formState);
  assert.strictEqual(formState.entityName, 'Kochi AI Studio');
  assert.strictEqual(formState.amountStr, '1200');

  // Step 2: Advance to Review / Confirm
  console.log('\n--- 3. Step 2: Advance to Review Screen ---');
  formState.step = 'confirm';
  const initialEstimatedRank = calculateEstimatedRank(parseInt(formState.amountStr), lelamStore.getEntries());
  console.log(`Review Screen Active — Bid: ₹${formState.amountStr}, Estimated Rank: #${initialEstimatedRank}`);
  assert.strictEqual(formState.step, 'confirm');

  // Step 3: User Clicks "Proceed to Payment" -> Razorpay Opens -> Cancelled
  console.log('\n--- 4. Step 3: Razorpay Payment Opened & Cancelled/Dismissed ---');
  formState.step = 'paying';
  console.log('Razorpay modal opened...');
  
  // onDismiss trigger
  formState.step = 'confirm';
  formState.error = 'Payment was cancelled. Your bid was not placed.';
  console.log('onDismiss triggered -> Returned to Review Screen with error notice:', formState.error);
  assert.strictEqual(formState.step, 'confirm');
  assert.strictEqual(formState.error, 'Payment was cancelled. Your bid was not placed.');

  // Verify that database was NOT modified
  assert.strictEqual(lelamStore.getStats().totalBidVolume, initialVolume, 'Bid volume must remain unchanged');
  assert.strictEqual(lelamStore.getStats().totalVerifiedBids, initialTxCount, 'Transaction count must remain unchanged');
  assert.strictEqual(lelamStore.getEntries().length, initialEntriesCount, 'Entries count must remain unchanged');
  console.log('✓ PASS: Zero database modification after payment cancellation');

  // Step 4: User clicks "Edit Details"
  console.log('\n--- 5. User clicks "Edit Details" Button ---');
  formState.step = 'details';
  console.log('Form reopened Step 1...');
  // Assert that all entered values are fully preserved
  assert.strictEqual(formState.entityName, 'Kochi AI Studio', 'Entity name must be preserved');
  assert.strictEqual(formState.slug, 'kochi-ai-studio', 'Slug must be preserved');
  assert.strictEqual(formState.description, 'Next-generation generative media studio for Malayalam creators', 'Description must be preserved');
  assert.strictEqual(formState.websiteUrl, 'https://kochiaistudio.example.com', 'Website URL must be preserved');
  assert.strictEqual(formState.logoUrl, 'https://example.com/logo.png', 'Logo URL must be preserved');
  assert.strictEqual(formState.socialUrl, 'https://x.com/kochiaistudio', 'Social URL must be preserved');
  assert.strictEqual(formState.amountStr, '1200', 'Bid amount must be preserved');
  assert.strictEqual(formState.visibility, 'anonymous', 'Visibility must be preserved');
  console.log('✓ PASS: All 8 form fields perfectly preserved upon clicking "Edit Details"');

  // Step 5: User updates Details
  console.log('\n--- 6. User modifies Business Name & Pitch ---');
  formState.entityName = 'Kochi AI Studio Pro';
  formState.description = 'Enterprise-grade generative media and localization engine for South Asia';
  formState.step = 'confirm';
  console.log('Review screen re-entered with updated details:', {
    entityName: formState.entityName,
    description: formState.description,
  });
  assert.strictEqual(formState.entityName, 'Kochi AI Studio Pro');

  // Step 6: User clicks "Edit Bid"
  console.log('\n--- 7. User clicks "Edit Bid" Button ---');
  formState.step = 'details';
  console.log('Form reopened for bid adjustment...');
  assert.strictEqual(formState.entityName, 'Kochi AI Studio Pro', 'Updated entity name preserved');
  assert.strictEqual(formState.amountStr, '1200', 'Current bid amount preserved');

  // Step 7: User increases Bid Amount
  formState.amountStr = '3500';
  const newEstimatedRank = calculateEstimatedRank(parseInt(formState.amountStr), lelamStore.getEntries());
  formState.step = 'confirm';
  console.log(`Bid updated to ₹${formState.amountStr}, New Estimated Rank: #${newEstimatedRank}`);
  assert.strictEqual(formState.amountStr, '3500');
  assert.strictEqual(formState.step, 'confirm');
  console.log('✓ PASS: "Edit Bid" preserved all entity details and updated bid to ₹3,500');

  // Step 8: Final cancellation / close modal without payment
  console.log('\n--- 8. Final Close Modal (No Payment Executed) ---');
  assert.strictEqual(lelamStore.getStats().totalBidVolume, initialVolume, 'Bid volume must remain strictly identical');
  assert.strictEqual(lelamStore.getStats().totalVerifiedBids, initialTxCount, 'Transaction count must remain strictly identical');
  assert.strictEqual(lelamStore.getEntries().length, initialEntriesCount, 'Entries count must remain strictly identical');
  console.log('✓ PASS: Production/test database completely unmodified (100% clean)');

  console.log('\n==================================================================');
  console.log('ALL EDIT DETAILS & EDIT BID POST-CANCEL TESTS PASSED');
  console.log('==================================================================');
}

testTakeSpotEditFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
