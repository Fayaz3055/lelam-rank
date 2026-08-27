import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local natively
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

async function previewCleanupData() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.log('Supabase URL or service role key not configured in .env.local');
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('==================================================');
  console.log('PREVIEW OF RECORDS TARGETED BY CLEANUP SCRIPT');
  console.log('(READ-ONLY SELECT QUERIES — NO DATA MODIFIED)');
  console.log('==================================================\n');

  // 1. Entries targeted
  const { data: entries, error: errEntries } = await supabase
    .from('entries')
    .select('id, name, slug, current_bid, status, created_at')
    .or('slug.ilike.lelam-test-%,slug.ilike.lelam-final-test-%,name.ilike.LELAM Test%,name.ilike.LELAM Final Test%');

  console.log('1. TARGETED TEST ENTRIES:');
  console.log('   Count:', entries?.length || 0);
  if (entries && entries.length > 0) {
    console.table(entries);
  } else {
    console.log('   (No matching test entries found in database)');
  }

  const targetEntryIds = entries?.map((e) => e.id) || [];

  // 2. Bids belonging to those entries
  let bids = [];
  if (targetEntryIds.length > 0) {
    const { data: bidsData } = await supabase
      .from('bids')
      .select('id, entry_id, amount, bidder_name, verified_at')
      .in('entry_id', targetEntryIds);
    bids = bidsData || [];
  }
  console.log('\n2. TARGETED TEST BIDS:');
  console.log('   Count:', bids.length);
  if (bids.length > 0) {
    console.table(bids);
  } else {
    console.log('   (No matching test bids found in database)');
  }

  // 3. Payments belonging to those entries
  let payments = [];
  if (targetEntryIds.length > 0) {
    const { data: payData } = await supabase
      .from('payments')
      .select('id, entry_id, amount, provider_order_id, status')
      .in('entry_id', targetEntryIds);
    payments = payData || [];
  }
  console.log('\n3. TARGETED TEST PAYMENTS:');
  console.log('   Count:', payments.length);
  if (payments.length > 0) {
    console.table(payments);
  } else {
    console.log('   (No matching test payments found in database)');
  }

  // 4. Activity records belonging to those entries
  let activities = [];
  if (targetEntryIds.length > 0) {
    const { data: actData } = await supabase
      .from('activity')
      .select('id, entry_id, event_type, amount, created_at')
      .in('entry_id', targetEntryIds);
    activities = actData || [];
  }
  console.log('\n4. TARGETED TEST ACTIVITY RECORDS:');
  console.log('   Count:', activities.length);
  if (activities.length > 0) {
    console.table(activities);
  } else {
    console.log('   (No matching test activity records found in database)');
  }

  // 5. Targeted Profiles (@example.com and role != 'admin')
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .neq('role', 'admin')
    .or('email.ilike.%@example.com,email.ilike.founder_test_%,email.ilike.outbidder_%');

  console.log('\n5. TARGETED TEST USER PROFILES (ADMINS EXCLUDED):');
  console.log('   Count:', profiles?.length || 0);
  if (profiles && profiles.length > 0) {
    console.table(profiles);
  } else {
    console.log('   (No matching test profiles found in database)');
  }

  // 6. Admin Accounts Check (Verification of preservation)
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .eq('role', 'admin');

  console.log('\n6. ADMIN ACCOUNTS PROTECTED & PRESERVED:');
  console.log('   Count:', adminProfiles?.length || 0);
  if (adminProfiles && adminProfiles.length > 0) {
    console.table(adminProfiles);
  } else {
    console.log('   (No admin profiles registered in profiles table yet)');
  }

  // 7. Non-test / Real entries check
  const { data: realEntries } = await supabase
    .from('entries')
    .select('id, name, slug, current_bid')
    .not('slug', 'ilike', 'lelam-test-%')
    .not('slug', 'ilike', 'lelam-final-test-%')
    .not('name', 'ilike', 'LELAM Test%')
    .not('name', 'ilike', 'LELAM Final Test%');

  console.log('\n7. REAL / NON-TEST ENTRIES THAT WILL REMAIN UNTOUCHED:');
  console.log('   Count:', realEntries?.length || 0);
  if (realEntries && realEntries.length > 0) {
    console.table(realEntries);
  } else {
    console.log('   (None — database has 0 real/production entries currently)');
  }

  console.log('\n==================================================');
  console.log('READ-ONLY PREVIEW COMPLETE');
  console.log('==================================================');
}

previewCleanupData().catch(console.error);
