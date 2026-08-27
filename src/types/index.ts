export type EntryStatus = 'active' | 'suspended' | 'removed';
export type BidVisibility = 'public' | 'anonymous';
export type PaymentStatus = 'created' | 'verified' | 'failed' | 'refunded';
export type ActivityEventType = 'new_entry' | 'rank_up' | 'outbid' | 'new_bid';

export interface Entry {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  social_url?: string;
  status: EntryStatus;
  featured: boolean;
  current_rank?: number;
  current_bid: number;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  entry_id: string;
  bidder_id: string;
  bidder_name?: string;
  amount: number;
  payment_id: string;
  visibility: BidVisibility;
  verified_at: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  entry_id: string;
  amount: number;
  provider: 'razorpay' | 'test_sandbox';
  provider_order_id: string;
  provider_payment_id?: string;
  status: PaymentStatus;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  entry_id: string;
  entry_name: string;
  entry_slug: string;
  event_type: ActivityEventType;
  amount: number;
  old_rank?: number;
  new_rank: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface LeaderboardStats {
  championBid: number;
  championName: string;
  championSlug: string;
  totalEntries: number;
  totalBidVolume: number;
  totalVerifiedBids: number;
}
