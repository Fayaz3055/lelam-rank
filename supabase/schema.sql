-- LELAM RANK V1 Production Database Schema & RPC Functions (Supabase)
-- Tagline: "Bid. Rank. Rise."
-- Positioning: "Where Kerala startups, businesses and digital products compete for the top."

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Trigger to automatically create profile when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Anonymous users / guests do not have emails and should not create permanent registered profiles
  IF COALESCE(NEW.is_anonymous, FALSE) IS TRUE OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user' -- Always enforce default role = 'user' on signup
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      username = COALESCE(EXCLUDED.username, public.profiles.username),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to strictly PREVENT privilege escalation (users cannot alter role or id)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent non-service-role callers from modifying role or id
  IF auth.role() != 'service_role' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: Users are not permitted to modify profile roles.';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Unauthorized: Profile ID cannot be modified.';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 2. Entries Table (Startups, SaaS, AI Tools, Businesses, Digital Products)
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  social_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  current_bid NUMERIC(12, 2) NOT NULL DEFAULT 50.00 CHECK (current_bid >= 50.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_slug ON public.entries(slug);
CREATE INDEX IF NOT EXISTS idx_entries_status ON public.entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_owner ON public.entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_entries_current_bid ON public.entries(current_bid DESC);

-- 3. Payments Table (Razorpay & Sandbox transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 50.00),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT NOT NULL UNIQUE,
  provider_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'verified', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_entry ON public.payments(entry_id);

-- 4. Bids Table (Permanent, Verified bids)
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bidder_name TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 50.00),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'anonymous')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_entry_amount ON public.bids(entry_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_bids_verified_at ON public.bids(verified_at ASC);

-- 5. Activity Log Table (Genuine Real-Time Leaderboard Events)
CREATE TABLE IF NOT EXISTS public.activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('new_entry', 'rank_up', 'outbid', 'new_bid')),
  bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity(created_at DESC);

-- 6. Deterministic Leaderboard View
-- 1. Highest verified bid amount DESC
-- 2. Tied bids resolved by earlier verified payment timestamp ASC
-- 3. Earlier entry creation timestamp ASC
CREATE OR REPLACE VIEW public.leaderboard_view AS
WITH verified_entry_max_bids AS (
  SELECT 
    e.id AS entry_id,
    e.slug,
    e.name,
    e.description,
    e.logo_url,
    e.website_url,
    e.social_url,
    e.status,
    e.featured,
    e.owner_id,
    e.created_at AS entry_created_at,
    COALESCE(MAX(b.amount), e.current_bid) AS highest_bid,
    COALESCE(MIN(b.verified_at), e.created_at) AS first_highest_bid_at
  FROM public.entries e
  LEFT JOIN public.bids b ON e.id = b.entry_id
  WHERE e.status = 'active'
  GROUP BY e.id, e.slug, e.name, e.description, e.logo_url, e.website_url, e.social_url, e.status, e.featured, e.owner_id, e.created_at, e.current_bid
)
SELECT
  entry_id,
  slug,
  name,
  description,
  logo_url,
  website_url,
  social_url,
  status,
  featured,
  owner_id,
  highest_bid AS current_bid,
  first_highest_bid_at,
  entry_created_at,
  ROW_NUMBER() OVER (
    ORDER BY highest_bid DESC, first_highest_bid_at ASC, entry_created_at ASC
  ) AS rank
FROM verified_entry_max_bids;

-- 7. ATOMIC RPC FUNCTION: place_verified_bid
-- Protects against race conditions via FOR UPDATE row locking and ensures idempotent execution
CREATE OR REPLACE FUNCTION public.place_verified_bid(
  p_entry_id UUID,
  p_bidder_id UUID,
  p_amount NUMERIC(12, 2),
  p_payment_id UUID,
  p_bidder_name TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT 'public'
)
RETURNS JSONB AS $$
DECLARE
  v_entry RECORD;
  v_payment RECORD;
  v_bid_id UUID;
  v_old_rank INT;
  v_new_rank INT;
  v_event_type TEXT;
  v_existing_bid RECORD;
BEGIN
  -- 1. Authorization check: caller must match bidder or be service_role
  IF auth.uid() IS NOT NULL AND auth.uid() != p_bidder_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Caller cannot place bid on behalf of another user ID';
  END IF;

  -- 2. Verify payment existence & matching details
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Invalid payment reference %', p_payment_id;
  END IF;

  IF v_payment.entry_id != p_entry_id THEN
    RAISE EXCEPTION 'Payment % does not match entry %', p_payment_id, p_entry_id;
  END IF;

  -- 3. Check if payment was already processed (Idempotency)
  SELECT id INTO v_existing_bid FROM public.bids WHERE payment_id = p_payment_id;
  IF v_existing_bid.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'bid_id', v_existing_bid.id
    );
  END IF;

  -- 4. Lock entry row to prevent race conditions during concurrent bids
  SELECT * INTO v_entry FROM public.entries WHERE id = p_entry_id FOR UPDATE;
  IF v_entry.id IS NULL THEN
    RAISE EXCEPTION 'Entry with id % not found', p_entry_id;
  END IF;

  IF v_entry.status != 'active' THEN
    RAISE EXCEPTION 'Cannot bid on a suspended or removed entry';
  END IF;

  IF p_amount <= v_entry.current_bid THEN
    RAISE EXCEPTION 'Bid amount % must be strictly greater than current bid %', p_amount, v_entry.current_bid;
  END IF;

  -- 5. Calculate old rank
  SELECT rank INTO v_old_rank FROM public.leaderboard_view WHERE entry_id = p_entry_id;

  -- 6. Mark payment verified
  UPDATE public.payments 
  SET status = 'verified'
  WHERE id = p_payment_id;

  -- 7. Insert new verified bid
  INSERT INTO public.bids (
    entry_id, bidder_id, bidder_name, amount, payment_id, visibility, verified_at
  )
  VALUES (
    p_entry_id, p_bidder_id, p_bidder_name, p_amount, p_payment_id, p_visibility, NOW()
  )
  RETURNING id INTO v_bid_id;

  -- 8. Update entry current_bid and timestamp
  UPDATE public.entries
  SET current_bid = p_amount,
      updated_at = NOW()
  WHERE id = p_entry_id;

  -- 9. Calculate new rank from updated view
  SELECT rank INTO v_new_rank FROM public.leaderboard_view WHERE entry_id = p_entry_id;

  v_event_type := CASE 
    WHEN v_old_rank IS NOT NULL AND v_new_rank < v_old_rank THEN 'rank_up'
    ELSE 'new_bid'
  END;

  -- 10. Record genuine activity event
  INSERT INTO public.activity (
    entry_id, event_type, bid_id, amount, metadata
  )
  VALUES (
    p_entry_id,
    v_event_type,
    v_bid_id,
    p_amount,
    jsonb_build_object(
      'entry_name', v_entry.name,
      'entry_slug', v_entry.slug,
      'old_rank', v_old_rank,
      'new_rank', v_new_rank
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'bid_id', v_bid_id,
    'entry_id', p_entry_id,
    'amount', p_amount,
    'old_rank', v_old_rank,
    'new_rank', v_new_rank
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies creation
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Active entries are readable by everyone" ON public.entries;
CREATE POLICY "Active entries are readable by everyone" ON public.entries FOR SELECT USING (status = 'active' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Authenticated users can insert entries" ON public.entries;
CREATE POLICY "Authenticated users can insert entries" ON public.entries FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update own entries" ON public.entries;
CREATE POLICY "Owners can update own entries" ON public.entries FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Bids are readable by everyone" ON public.bids;
CREATE POLICY "Bids are readable by everyone" ON public.bids FOR SELECT USING (true);

DROP POLICY IF EXISTS "Activity is readable by everyone" ON public.activity;
CREATE POLICY "Activity is readable by everyone" ON public.activity FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read own payments" ON public.payments;
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
