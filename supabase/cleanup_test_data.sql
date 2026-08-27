-- ==============================================================================
-- LELAM RANK — Production Test Data Cleanup Script
-- Safely removes all test entities, bids, payments, and test users from testing
-- PRESERVES: All admin accounts (role = 'admin') and schema structure
-- ==============================================================================

BEGIN;

-- 1. Remove all test activity records associated with test slugs or test names
DELETE FROM public.activity
WHERE entry_id IN (
  SELECT id FROM public.entries 
  WHERE slug LIKE 'lelam-test-%' 
     OR slug LIKE 'lelam-final-test-%'
     OR name LIKE 'LELAM Test%'
     OR name LIKE 'LELAM Final Test%'
);

-- 2. Remove all test bids associated with test entries
DELETE FROM public.bids
WHERE entry_id IN (
  SELECT id FROM public.entries 
  WHERE slug LIKE 'lelam-test-%' 
     OR slug LIKE 'lelam-final-test-%'
     OR name LIKE 'LELAM Test%'
     OR name LIKE 'LELAM Final Test%'
);

-- 3. Remove all test payments associated with test entries
DELETE FROM public.payments
WHERE entry_id IN (
  SELECT id FROM public.entries 
  WHERE slug LIKE 'lelam-test-%' 
     OR slug LIKE 'lelam-final-test-%'
     OR name LIKE 'LELAM Test%'
     OR name LIKE 'LELAM Final Test%'
);

-- 4. Remove all test entries
DELETE FROM public.entries
WHERE slug LIKE 'lelam-test-%' 
   OR slug LIKE 'lelam-final-test-%'
   OR name LIKE 'LELAM Test%'
   OR name LIKE 'LELAM Final Test%';

-- 5. Remove test user profiles (PRESERVING ADMIN ACCOUNTS)
DELETE FROM public.profiles
WHERE role != 'admin'
  AND (
    email LIKE 'founder_test_%@example.com'
    OR email LIKE 'outbidder_%@example.com'
    OR email LIKE 'founder_final_%@example.com'
    OR email LIKE '%@example.com'
  );

-- 6. Remove test auth users (PRESERVING ADMIN ACCOUNTS)
DELETE FROM auth.users
WHERE id NOT IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
)
AND (
  email LIKE 'founder_test_%@example.com'
  OR email LIKE 'outbidder_%@example.com'
  OR email LIKE 'founder_final_%@example.com'
  OR email LIKE '%@example.com'
);

COMMIT;
