import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Entry, Bid, Payment, ActivityEvent, LeaderboardStats } from '@/types';
import { lelamStore } from '@/lib/store';
import { sortLeaderboard } from '@/lib/ranking';

export const dbService = {
  async getLeaderboardEntries(): Promise<Entry[]> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*');

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.entry_id,
          owner_id: row.owner_id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          logo_url: row.logo_url || undefined,
          website_url: row.website_url || undefined,
          social_url: row.social_url || undefined,
          status: row.status,
          featured: row.featured,
          current_bid: Number(row.current_bid),
          current_rank: Number(row.rank),
          created_at: row.entry_created_at,
          updated_at: row.first_highest_bid_at || row.entry_created_at,
        }));
      }
    }
    // Fallback store
    return lelamStore.getEntries();
  },

  async getEntryBySlug(slug: string): Promise<Entry | null> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('slug', slug.toLowerCase().trim())
        .single();

      if (!error && data) {
        return {
          id: data.entry_id,
          owner_id: data.owner_id,
          slug: data.slug,
          name: data.name,
          description: data.description,
          logo_url: data.logo_url || undefined,
          website_url: data.website_url || undefined,
          social_url: data.social_url || undefined,
          status: data.status,
          featured: data.featured,
          current_bid: Number(data.current_bid),
          current_rank: Number(data.rank),
          created_at: data.entry_created_at,
          updated_at: data.first_highest_bid_at || data.entry_created_at,
        };
      }
    }
    return lelamStore.getEntryBySlug(slug) || null;
  },

  async getBidsForEntry(entryId: string): Promise<Bid[]> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('entry_id', entryId)
        .order('verified_at', { ascending: false });

      if (!error && data) {
        return data.map((b: any) => ({
          id: b.id,
          entry_id: b.entry_id,
          bidder_id: b.bidder_id,
          bidder_name: b.bidder_name,
          amount: Number(b.amount),
          payment_id: b.payment_id,
          visibility: b.visibility,
          verified_at: b.verified_at,
          created_at: b.created_at,
        }));
      }
    }
    return lelamStore.getBidsByEntryId(entryId);
  },

  async getActivityFeed(): Promise<ActivityEvent[]> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        return data.map((act: any) => ({
          id: act.id,
          entry_id: act.entry_id,
          entry_name: act.metadata?.entry_name || 'Verified Entry',
          entry_slug: act.metadata?.entry_slug || '',
          event_type: act.event_type,
          amount: Number(act.amount),
          old_rank: act.metadata?.old_rank,
          new_rank: act.metadata?.new_rank || 1,
          created_at: act.created_at,
        }));
      }
    }
    return lelamStore.getActivity();
  },

  async getStats(): Promise<LeaderboardStats> {
    const entries = await this.getLeaderboardEntries();
    const active = entries.filter((e) => e.status === 'active');
    const champion = active[0];
    const totalVolume = active.reduce((acc, curr) => acc + curr.current_bid, 0);

    return {
      championBid: champion ? champion.current_bid : 0,
      championName: champion ? champion.name : 'No Contender Yet',
      championSlug: champion ? champion.slug : '',
      totalEntries: active.length,
      totalBidVolume: totalVolume,
      totalVerifiedBids: active.length,
    };
  },

  async createEntry(data: {
    name: string;
    slug: string;
    description: string;
    logo_url?: string;
    website_url?: string;
    social_url?: string;
    initial_bid: number;
    owner_id: string; // Strictly authenticated owner ID required
    bidder_name?: string;
    visibility?: 'public' | 'anonymous';
  }): Promise<{ entry: Entry; rank: number }> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data: insertedEntry, error: insertError } = await supabase
        .from('entries')
        .insert({
          name: data.name,
          slug: data.slug.toLowerCase().trim(),
          description: data.description,
          logo_url: data.logo_url || null,
          website_url: data.website_url || null,
          social_url: data.social_url || null,
          current_bid: data.initial_bid,
          status: 'active',
          owner_id: data.owner_id,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Create payment record
      const { data: insertedPayment, error: payError } = await supabase
        .from('payments')
        .insert({
          user_id: data.owner_id,
          entry_id: insertedEntry.id,
          amount: data.initial_bid,
          provider: 'razorpay',
          provider_order_id: `order_${Date.now()}`,
          provider_payment_id: `pay_${Date.now()}`,
          status: 'verified',
        })
        .select()
        .single();

      if (!payError && insertedPayment) {
        // Record verified bid via atomic RPC function
        await supabase.rpc('place_verified_bid', {
          p_entry_id: insertedEntry.id,
          p_bidder_id: data.owner_id,
          p_amount: data.initial_bid,
          p_payment_id: insertedPayment.id,
          p_bidder_name: data.bidder_name || data.name,
          p_visibility: data.visibility || 'public',
        });
      }

      const refreshed = await this.getEntryBySlug(insertedEntry.slug);
      return {
        entry: refreshed || insertedEntry,
        rank: refreshed?.current_rank || 1,
      };
    }

    // Fallback store
    const result = lelamStore.createEntry(data);
    return { entry: result.entry, rank: result.rank };
  },

  async placeVerifiedBid(data: {
    entryId: string;
    amount: number;
    bidder_id?: string;
    bidder_name?: string;
    visibility?: 'public' | 'anonymous';
    paymentId?: string;
  }): Promise<{ newRank: number; oldRank: number }> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      // 1. Create payment record if not provided
      let paymentId = data.paymentId;
      if (!paymentId) {
        const { data: payRecord } = await supabase
          .from('payments')
          .insert({
            user_id: data.bidder_id,
            entry_id: data.entryId,
            amount: data.amount,
            provider: 'razorpay',
            provider_order_id: `order_${Date.now()}`,
            provider_payment_id: `pay_${Date.now()}`,
            status: 'verified',
          })
          .select()
          .single();
        paymentId = payRecord?.id;
      }

      // 2. Call authoritative atomic RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('place_verified_bid', {
        p_entry_id: data.entryId,
        p_bidder_id: data.bidder_id,
        p_amount: data.amount,
        p_payment_id: paymentId,
        p_bidder_name: data.bidder_name,
        p_visibility: data.visibility || 'public',
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      return {
        newRank: rpcResult?.new_rank || 1,
        oldRank: rpcResult?.old_rank || 99,
      };
    }

    // Fallback store
    const result = lelamStore.placeVerifiedBid(data);
    return { newRank: result.newRank, oldRank: result.oldRank };
  },

  async updateEntryStatus(entryId: string, status: Entry['status']): Promise<void> {
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId,
          action: status === 'active' ? 'activate' : status === 'suspended' ? 'suspend' : 'remove',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Admin moderation failed');
      }
    } catch {
      lelamStore.updateEntryStatus(entryId, status);
    }
  },

  async toggleFeatured(entryId: string): Promise<void> {
    try {
      const entry = (await this.getLeaderboardEntries()).find((e) => e.id === entryId);
      const nextFeaturedAction = entry?.featured ? 'unfeature' : 'feature';
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId,
          action: nextFeaturedAction,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Admin moderation failed');
      }
    } catch {
      lelamStore.toggleFeatured(entryId);
    }
  },
};
