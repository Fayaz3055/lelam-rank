import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local natively
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

async function executeCleanup() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.log('Supabase credentials not found in .env.local');
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('==================================================');
  console.log('EXECUTING SAFE PRODUCTION TEST DATA CLEANUP');
  console.log('==================================================\n');

  // 1. Delete test activity records
  const { data: testEntries } = await supabase
    .from('entries')
    .select('id')
    .or('slug.ilike.lelam-test-%,slug.ilike.lelam-final-test-%,name.ilike.LELAM Test%,name.ilike.LELAM Final Test%');

  const targetEntryIds = testEntries?.map((e) => e.id) || [];

  if (targetEntryIds.length > 0) {
    await supabase.from('activity').delete().in('entry_id', targetEntryIds);
    await supabase.from('bids').delete().in('entry_id', targetEntryIds);
    await supabase.from('payments').delete().in('entry_id', targetEntryIds);
    await supabase.from('entries').delete().in('id', targetEntryIds);
    console.log('✓ Cleaned test entries, bids, payments, activity');
  }

  // 2. Fetch test user profiles (@example.com and role != 'admin')
  const { data: testProfiles } = await supabase
    .from('profiles')
    .select('id, email')
    .neq('role', 'admin')
    .or('email.ilike.%@example.com,email.ilike.founder_test_%,email.ilike.outbidder_%,email.ilike.prod_founder_%,email.ilike.tester_%');

  if (testProfiles && testProfiles.length > 0) {
    console.log(`Found ${testProfiles.length} test profiles to delete.`);
    for (const p of testProfiles) {
      // Delete from profiles
      await supabase.from('profiles').delete().eq('id', p.id);
      // Delete from auth.users
      try {
        await supabase.auth.admin.deleteUser(p.id);
      } catch (err) {
        console.warn(`Could not delete auth user ${p.id}:`, err.message);
      }
    }
    console.log('✓ Deleted test user accounts');
  }

  // 3. Final verification of remaining records
  const { count: entriesCount } = await supabase.from('entries').select('*', { count: 'exact', head: true });
  const { count: bidsCount } = await supabase.from('bids').select('*', { count: 'exact', head: true });
  const { count: paymentsCount } = await supabase.from('payments').select('*', { count: 'exact', head: true });
  const { count: activitiesCount } = await supabase.from('activity').select('*', { count: 'exact', head: true });
  const { data: remainingProfiles } = await supabase.from('profiles').select('id, email, role, created_at');

  console.log('\n==================================================');
  console.log('CLEAN BASELINE VERIFICATION:');
  console.log('==================================================');
  console.log('Active Entries:        ', entriesCount || 0);
  console.log('Verified Bids:         ', bidsCount || 0);
  console.log('Payments:              ', paymentsCount || 0);
  console.log('Activity Events:       ', activitiesCount || 0);
  console.log('Remaining Profiles:    ', remainingProfiles?.length || 0);
  if (remainingProfiles && remainingProfiles.length > 0) {
    console.log('\nPreserved Profiles:');
    console.table(remainingProfiles);
  }
  console.log('\n✓ Fresh database reset complete. Ready for real user onboarding.');
}

executeCleanup().catch(console.error);
