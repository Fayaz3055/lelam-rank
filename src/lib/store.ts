import { Entry, Bid, Payment, ActivityEvent, LeaderboardStats, UserProfile } from '@/types';
import { sortLeaderboard, calculateEstimatedRank } from './ranking';

// Initial realistic Kerala tech startups & products seed data
const SEED_ENTRIES: Entry[] = [
  {
    id: 'entry-1',
    owner_id: 'user-kochi-robotics',
    slug: 'kochi-robotics',
    name: 'Kochi Robotics',
    description: 'Industrial robotics and AI automation platform engineered at Infopark Kochi.',
    logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://kochirobotics.example.com',
    social_url: 'https://twitter.com/kochirobotics',
    status: 'active',
    featured: true,
    current_bid: 25000,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'entry-2',
    owner_id: 'user-spices-ai',
    slug: 'spices-ai',
    name: 'SpicesAI',
    description: 'Computer vision and sensory intelligence for commodity grading and agricultural trade.',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://spicesai.example.com',
    social_url: 'https://linkedin.com/company/spicesai',
    status: 'active',
    featured: true,
    current_bid: 18500,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'entry-3',
    owner_id: 'user-rave-work',
    slug: 'rave-work',
    name: 'RAVE.WORK',
    description: 'Asynchronous collaboration suite built for fast-moving distributed engineering teams.',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://rave.work',
    social_url: 'https://twitter.com/ravework',
    status: 'active',
    featured: true,
    current_bid: 12500,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
  },
  {
    id: 'entry-4',
    owner_id: 'user-zylo-saas',
    slug: 'zylo-saas',
    name: 'Zylo SaaS',
    description: 'Intelligent customer onboarding, product tours, and retention metrics in one SDK.',
    logo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://zylosaas.example.com',
    social_url: 'https://instagram.com/zylosaas',
    status: 'active',
    featured: false,
    current_bid: 9200,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'entry-5',
    owner_id: 'user-nila-analytics',
    slug: 'nila-analytics',
    name: 'Nila Analytics',
    description: 'Real-time revenue telemetry and buyer attribution tailored for modern Indian D2C brands.',
    logo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://nilaanalytics.example.com',
    social_url: 'https://twitter.com/nilaanalytics',
    status: 'active',
    featured: false,
    current_bid: 7500,
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3.5).toISOString(),
  },
  {
    id: 'entry-6',
    owner_id: 'user-monsoon-digital',
    slug: 'monsoon-digital',
    name: 'Monsoon Digital',
    description: 'High-craft design engineering studio shaping transformative digital products.',
    logo_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://monsoondigital.example.com',
    social_url: 'https://instagram.com/monsoondigital',
    status: 'active',
    featured: false,
    current_bid: 5000,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'entry-7',
    owner_id: 'user-kalari-cloud',
    slug: 'kalari-cloud',
    name: 'Kalari Cloud',
    description: 'Serverless compute and ultra-low latency edge cache built for South Asian traffic.',
    logo_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://kalaricloud.example.com',
    social_url: 'https://twitter.com/kalaricloud',
    status: 'active',
    featured: false,
    current_bid: 3800,
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'entry-8',
    owner_id: 'user-tech-malabar',
    slug: 'tech-malabar',
    name: 'TechMalabar',
    description: 'Community network, tech job board, and founder exchange across Northern Kerala.',
    logo_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://techmalabar.example.com',
    social_url: 'https://linkedin.com/company/techmalabar',
    status: 'active',
    featured: false,
    current_bid: 2500,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'entry-9',
    owner_id: 'user-coirtech-ai',
    slug: 'coirtech-ai',
    name: 'CoirTech AI',
    description: 'Bio-composite material simulation engine empowering eco-packaging innovators.',
    logo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://coirtech.example.com',
    social_url: 'https://twitter.com/coirtech',
    status: 'active',
    featured: false,
    current_bid: 1400,
    created_at: new Date(Date.now() - 86400000 * 13).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'entry-10',
    owner_id: 'user-backwater-pay',
    slug: 'backwater-pay',
    name: 'Backwater Pay',
    description: 'UPI and recurring mandate orchestration for micro-merchants and regional retail.',
    logo_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160&auto=format&fit=crop&q=80',
    website_url: 'https://backwaterpay.example.com',
    social_url: 'https://instagram.com/backwaterpay',
    status: 'active',
    featured: false,
    current_bid: 850,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const SEED_BIDS: Bid[] = [
  {
    id: 'bid-1',
    entry_id: 'entry-1',
    bidder_id: 'user-kochi-robotics',
    bidder_name: 'Kochi Robotics Team',
    amount: 25000,
    payment_id: 'pay-seed-1',
    visibility: 'public',
    verified_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'bid-2',
    entry_id: 'entry-2',
    bidder_id: 'user-spices-ai',
    bidder_name: 'SpicesAI Labs',
    amount: 18500,
    payment_id: 'pay-seed-2',
    visibility: 'public',
    verified_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'bid-3',
    entry_id: 'entry-3',
    bidder_id: 'user-rave-work',
    bidder_name: 'Rave Founder',
    amount: 12500,
    payment_id: 'pay-seed-3',
    visibility: 'public',
    verified_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
  },
  {
    id: 'bid-4',
    entry_id: 'entry-4',
    bidder_id: 'user-zylo-saas',
    bidder_name: 'Zylo Growth',
    amount: 9200,
    payment_id: 'pay-seed-4',
    visibility: 'public',
    verified_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'bid-5',
    entry_id: 'entry-5',
    bidder_id: 'user-nila-analytics',
    bidder_name: 'Nila Analytics',
    amount: 7500,
    payment_id: 'pay-seed-5',
    visibility: 'anonymous',
    verified_at: new Date(Date.now() - 86400000 * 3.5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3.5).toISOString(),
  },
];

const SEED_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act-1',
    entry_id: 'entry-1',
    entry_name: 'Kochi Robotics',
    entry_slug: 'kochi-robotics',
    event_type: 'rank_up',
    amount: 25000,
    old_rank: 2,
    new_rank: 1,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'act-2',
    entry_id: 'entry-2',
    entry_name: 'SpicesAI',
    entry_slug: 'spices-ai',
    event_type: 'new_bid',
    amount: 18500,
    new_rank: 2,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'act-3',
    entry_id: 'entry-3',
    entry_name: 'RAVE.WORK',
    entry_slug: 'rave-work',
    event_type: 'new_bid',
    amount: 12500,
    new_rank: 3,
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: 'act-4',
    entry_id: 'entry-4',
    entry_name: 'Zylo SaaS',
    entry_slug: 'zylo-saas',
    event_type: 'rank_up',
    amount: 9200,
    old_rank: 6,
    new_rank: 4,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'act-5',
    entry_id: 'entry-5',
    entry_name: 'Nila Analytics',
    entry_slug: 'nila-analytics',
    event_type: 'new_entry',
    amount: 7500,
    new_rank: 5,
    created_at: new Date(Date.now() - 3600000 * 32).toISOString(),
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-seed-1',
    user_id: 'user-kochi-robotics',
    entry_id: 'entry-1',
    amount: 25000,
    provider: 'razorpay',
    provider_order_id: 'order_test_kr_01',
    provider_payment_id: 'pay_test_kr_01',
    status: 'verified',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'pay-seed-2',
    user_id: 'user-spices-ai',
    entry_id: 'entry-2',
    amount: 18500,
    provider: 'razorpay',
    provider_order_id: 'order_test_sp_02',
    provider_payment_id: 'pay_test_sp_02',
    status: 'verified',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// Local storage key constants
const STORAGE_KEYS = {
  ENTRIES: 'lelam_rank_entries_v1',
  BIDS: 'lelam_rank_bids_v1',
  ACTIVITY: 'lelam_rank_activity_v1',
  PAYMENTS: 'lelam_rank_payments_v1',
  CURRENT_USER: 'lelam_rank_user_v1',
};

// Only enable realistic Kerala seed data when explicitly enabled via environment variable
const isSeedEnabled = process.env.NEXT_PUBLIC_ENABLE_SEED_DATA === 'true';
const INITIAL_ENTRIES: Entry[] = isSeedEnabled ? SEED_ENTRIES : [];
const INITIAL_BIDS: Bid[] = isSeedEnabled ? SEED_BIDS : [];
const INITIAL_ACTIVITY: ActivityEvent[] = isSeedEnabled ? SEED_ACTIVITY : [];
const INITIAL_PAYMENTS: Payment[] = isSeedEnabled ? SEED_PAYMENTS : [];

class LelamStore {
  private getStored<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }

  private setStored<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch custom event so reactive UI components across pages update immediately
      window.dispatchEvent(new Event('lelam_store_updated'));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  public getEntries(): Entry[] {
    const raw = this.getStored<Entry[]>(STORAGE_KEYS.ENTRIES, INITIAL_ENTRIES);
    return sortLeaderboard(raw);
  }

  public getEntryBySlug(slug: string): Entry | undefined {
    const entries = this.getEntries();
    return entries.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
  }

  public getEntryById(id: string): Entry | undefined {
    const entries = this.getEntries();
    return entries.find((e) => e.id === id);
  }

  public getBidsByEntryId(entryId: string): Bid[] {
    const allBids = this.getStored<Bid[]>(STORAGE_KEYS.BIDS, INITIAL_BIDS);
    return allBids
      .filter((b) => b.entry_id === entryId)
      .sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime());
  }

  public getActivity(): ActivityEvent[] {
    const list = this.getStored<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITY);
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getPayments(): Payment[] {
    return this.getStored<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  public getStats(): LeaderboardStats {
    const entries = this.getEntries();
    const active = entries.filter((e) => e.status === 'active');
    const champion = active[0];
    const totalVolume = entries.reduce((acc, curr) => acc + curr.current_bid, 0);
    const bids = this.getStored<Bid[]>(STORAGE_KEYS.BIDS, INITIAL_BIDS);

    return {
      championBid: champion ? champion.current_bid : 0,
      championName: champion ? champion.name : 'No Contender Yet',
      championSlug: champion ? champion.slug : '',
      totalEntries: active.length,
      totalBidVolume: totalVolume,
      totalVerifiedBids: bids.length,
    };
  }

  public createEntry(data: {
    name: string;
    slug: string;
    description: string;
    logo_url?: string;
    website_url?: string;
    social_url?: string;
    initial_bid: number;
    owner_id?: string;
    bidder_name?: string;
    visibility?: 'public' | 'anonymous';
  }): { entry: Entry; bid: Bid; rank: number } {
    const entries = this.getEntries();
    const existing = entries.find((e) => e.slug.toLowerCase() === data.slug.toLowerCase());
    if (existing) {
      throw new Error(`The slug "${data.slug}" is already taken.`);
    }

    if (data.initial_bid < 50) {
      throw new Error('Minimum bid is ₹50.');
    }

    const now = new Date().toISOString();
    const entryId = `entry-${Date.now()}`;
    const paymentId = `pay-${Date.now()}`;
    const bidId = `bid-${Date.now()}`;
    const ownerId = data.owner_id || 'demo-current-user';

    const newEntry: Entry = {
      id: entryId,
      owner_id: ownerId,
      slug: data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
      name: data.name.trim(),
      description: data.description.trim(),
      logo_url: data.logo_url?.trim() || undefined,
      website_url: data.website_url?.trim() || undefined,
      social_url: data.social_url?.trim() || undefined,
      status: 'active',
      featured: false,
      current_bid: data.initial_bid,
      created_at: now,
      updated_at: now,
    };

    const newBid: Bid = {
      id: bidId,
      entry_id: entryId,
      bidder_id: ownerId,
      bidder_name: data.bidder_name || data.name,
      amount: data.initial_bid,
      payment_id: paymentId,
      visibility: data.visibility || 'public',
      verified_at: now,
      created_at: now,
    };

    const newPayment: Payment = {
      id: paymentId,
      user_id: ownerId,
      entry_id: entryId,
      amount: data.initial_bid,
      provider: 'razorpay',
      provider_order_id: `order_test_${Date.now()}`,
      provider_payment_id: `pay_test_${Date.now()}`,
      status: 'verified',
      created_at: now,
    };

    const updatedEntries = [...entries, newEntry];
    const sorted = sortLeaderboard(updatedEntries);
    const calculatedRank = sorted.find((e) => e.id === entryId)?.current_rank || 1;

    const newActivity: ActivityEvent = {
      id: `act-${Date.now()}`,
      entry_id: entryId,
      entry_name: newEntry.name,
      entry_slug: newEntry.slug,
      event_type: 'new_entry',
      amount: data.initial_bid,
      new_rank: calculatedRank,
      created_at: now,
    };

    const allBids = this.getStored<Bid[]>(STORAGE_KEYS.BIDS, INITIAL_BIDS);
    const allActivity = this.getStored<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITY);
    const allPayments = this.getStored<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);

    this.setStored(STORAGE_KEYS.ENTRIES, sorted);
    this.setStored(STORAGE_KEYS.BIDS, [newBid, ...allBids]);
    this.setStored(STORAGE_KEYS.PAYMENTS, [newPayment, ...allPayments]);
    this.setStored(STORAGE_KEYS.ACTIVITY, [newActivity, ...allActivity]);

    return { entry: newEntry, bid: newBid, rank: calculatedRank };
  }

  public placeVerifiedBid(data: {
    entryId: string;
    amount: number;
    bidder_id?: string;
    bidder_name?: string;
    visibility?: 'public' | 'anonymous';
  }): { entry: Entry; bid: Bid; newRank: number; oldRank: number } {
    const entries = this.getEntries();
    const entryIndex = entries.findIndex((e) => e.id === data.entryId);
    if (entryIndex === -1) {
      throw new Error('Entry not found');
    }

    const currentEntry = entries[entryIndex];
    if (data.amount <= currentEntry.current_bid) {
      throw new Error(
        `Bid must be strictly greater than current bid (₹${currentEntry.current_bid.toLocaleString('en-IN')})`
      );
    }

    const oldRank = currentEntry.current_rank || 999;
    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}`;
    const bidId = `bid-${Date.now()}`;
    const bidderId = data.bidder_id || 'demo-current-user';

    const newBid: Bid = {
      id: bidId,
      entry_id: currentEntry.id,
      bidder_id: bidderId,
      bidder_name: data.bidder_name || (data.visibility === 'anonymous' ? 'Anonymous' : currentEntry.name),
      amount: data.amount,
      payment_id: paymentId,
      visibility: data.visibility || 'public',
      verified_at: now,
      created_at: now,
    };

    const newPayment: Payment = {
      id: paymentId,
      user_id: bidderId,
      entry_id: currentEntry.id,
      amount: data.amount,
      provider: 'razorpay',
      provider_order_id: `order_test_${Date.now()}`,
      provider_payment_id: `pay_test_${Date.now()}`,
      status: 'verified',
      created_at: now,
    };

    // Update entry bid and timestamp
    const updatedEntry: Entry = {
      ...currentEntry,
      current_bid: data.amount,
      updated_at: now,
    };

    entries[entryIndex] = updatedEntry;
    const sorted = sortLeaderboard(entries);
    const newRank = sorted.find((e) => e.id === currentEntry.id)?.current_rank || 1;

    const eventType: ActivityEvent['event_type'] = newRank < oldRank ? 'rank_up' : 'new_bid';
    const newActivity: ActivityEvent = {
      id: `act-${Date.now()}`,
      entry_id: currentEntry.id,
      entry_name: currentEntry.name,
      entry_slug: currentEntry.slug,
      event_type: eventType,
      amount: data.amount,
      old_rank: oldRank,
      new_rank: newRank,
      created_at: now,
    };

    const allBids = this.getStored<Bid[]>(STORAGE_KEYS.BIDS, INITIAL_BIDS);
    const allActivity = this.getStored<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITY);
    const allPayments = this.getStored<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);

    this.setStored(STORAGE_KEYS.ENTRIES, sorted);
    this.setStored(STORAGE_KEYS.BIDS, [newBid, ...allBids]);
    this.setStored(STORAGE_KEYS.PAYMENTS, [newPayment, ...allPayments]);
    this.setStored(STORAGE_KEYS.ACTIVITY, [newActivity, ...allActivity]);

    return { entry: updatedEntry, bid: newBid, newRank, oldRank };
  }

  public updateEntryStatus(entryId: string, status: Entry['status']): void {
    const entries = this.getEntries();
    const updated = entries.map((e) => (e.id === entryId ? { ...e, status, updated_at: new Date().toISOString() } : e));
    this.setStored(STORAGE_KEYS.ENTRIES, sortLeaderboard(updated));
  }

  public toggleFeatured(entryId: string): void {
    const entries = this.getEntries();
    const updated = entries.map((e) => (e.id === entryId ? { ...e, featured: !e.featured } : e));
    this.setStored(STORAGE_KEYS.ENTRIES, updated);
  }

  public getCurrentUser(): UserProfile {
    return this.getStored<UserProfile>(STORAGE_KEYS.CURRENT_USER, {
      id: 'demo-current-user',
      email: 'founder@keralastartup.in',
      full_name: 'Arun Varma',
      role: 'user',
      created_at: new Date().toISOString(),
    });
  }

  public setCurrentUser(user: UserProfile): void {
    this.setStored(STORAGE_KEYS.CURRENT_USER, user);
  }
}

export const lelamStore = new LelamStore();
