import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { lelamStore } from '@/lib/store';
import { sortLeaderboard } from '@/lib/ranking';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('lelam_admin_session')?.value;

    let isAuthorized = false;

    // 1. Check HTTP-only admin session cookie
    if (adminSession === 'authenticated_admin') {
      isAuthorized = true;
    }

    // 2. Check Supabase server session
    if (!isAuthorized) {
      const serverSupabase = await createServerSupabaseClient();
      if (serverSupabase) {
        const { data } = await serverSupabase.auth.getUser();
        if (data.user) {
          const { data: profile } = await serverSupabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
          const userEmail = (data.user.email || '').trim().toLowerCase();

          if (
            profile?.role === 'admin' ||
            data.user.user_metadata?.role === 'admin' ||
            (configuredAdminEmail && userEmail === configuredAdminEmail)
          ) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authorization required to access platform data.' },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminSupabaseClient();

    if (adminSupabase) {
      // Fetch comprehensive platform data in parallel via service role
      const [
        entriesRes,
        leaderboardRes,
        paymentsRes,
        profilesRes,
        activityRes,
      ] = await Promise.all([
        adminSupabase
          .from('entries')
          .select('*')
          .order('created_at', { ascending: false }),
        adminSupabase
          .from('leaderboard_view')
          .select('*'),
        adminSupabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false }),
        adminSupabase
          .from('profiles')
          .select('id, email, username, full_name, role, created_at')
          .order('created_at', { ascending: false }),
        adminSupabase
          .from('activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const allEntries = entriesRes.data || [];
      const leaderboardEntries = leaderboardRes.data || [];
      const allPayments = paymentsRes.data || [];
      const allProfiles = profilesRes.data || [];
      const allActivities = activityRes.data || [];

      // Rank mapping from leaderboard_view
      const rankMap = new Map<string, number>();
      leaderboardEntries.forEach((row: any) => {
        rankMap.set(row.entry_id, Number(row.rank));
      });

      // Owner profile mapping
      const profileMap = new Map<string, { email?: string; full_name?: string; username?: string }>();
      allProfiles.forEach((p: any) => {
        profileMap.set(p.id, {
          email: p.email,
          full_name: p.full_name,
          username: p.username,
        });
      });

      // Decorated entries
      const decoratedEntries = allEntries.map((e: any) => {
        const owner = profileMap.get(e.owner_id);
        const rank = rankMap.get(e.id) || null;
        return {
          id: e.id,
          owner_id: e.owner_id,
          owner_email: owner?.email || 'Unknown',
          owner_name: owner?.full_name || owner?.username || 'Founder',
          slug: e.slug,
          name: e.name,
          description: e.description,
          logo_url: e.logo_url,
          website_url: e.website_url,
          social_url: e.social_url,
          status: e.status,
          featured: e.featured,
          current_bid: Number(e.current_bid),
          current_rank: rank,
          created_at: e.created_at,
          updated_at: e.updated_at,
        };
      });

      const activeEntries = decoratedEntries.filter((e: any) => e.status === 'active');
      const pendingEntries = decoratedEntries.filter((e: any) => e.status !== 'active');
      const verifiedPayments = allPayments.filter((p: any) => p.status === 'verified');
      const pendingPayments = allPayments.filter((p: any) => p.status !== 'verified');

      const totalVerifiedVolume = verifiedPayments.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
      const champion = activeEntries.find((e: any) => e.current_rank === 1) || activeEntries[0];

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers: allProfiles.length,
          totalEntries: allEntries.length,
          activeEntries: activeEntries.length,
          pendingEntries: pendingEntries.length,
          verifiedPaymentsCount: verifiedPayments.length,
          pendingPaymentsCount: pendingPayments.length,
          totalVerifiedVolume,
          championBid: champion ? champion.current_bid : 0,
          championName: champion ? champion.name : 'None',
        },
        entries: decoratedEntries,
        pendingPayments: pendingPayments.map((p: any) => {
          const owner = profileMap.get(p.user_id);
          const entry = allEntries.find((e: any) => e.id === p.entry_id);
          return {
            id: p.id,
            user_id: p.user_id,
            user_email: owner?.email || 'Unknown',
            entry_id: p.entry_id,
            entry_name: entry?.name || 'Unknown Entry',
            amount: Number(p.amount),
            provider: p.provider,
            provider_order_id: p.provider_order_id,
            provider_payment_id: p.provider_payment_id,
            status: p.status,
            created_at: p.created_at,
          };
        }),
        verifiedPayments: verifiedPayments.map((p: any) => {
          const owner = profileMap.get(p.user_id);
          const entry = allEntries.find((e: any) => e.id === p.entry_id);
          return {
            id: p.id,
            user_id: p.user_id,
            user_email: owner?.email || 'Unknown',
            entry_id: p.entry_id,
            entry_name: entry?.name || 'Unknown Entry',
            amount: Number(p.amount),
            provider: p.provider,
            provider_order_id: p.provider_order_id,
            provider_payment_id: p.provider_payment_id,
            status: p.status,
            created_at: p.created_at,
          };
        }),
        users: allProfiles,
        activities: allActivities.map((act: any) => ({
          id: act.id,
          entry_id: act.entry_id,
          entry_name: act.metadata?.entry_name || 'Entry',
          entry_slug: act.metadata?.entry_slug || '',
          event_type: act.event_type,
          amount: Number(act.amount),
          old_rank: act.metadata?.old_rank,
          new_rank: act.metadata?.new_rank || 1,
          created_at: act.created_at,
        })),
      });
    }

    // Fallback store simulation for development without Supabase credentials
    const storeEntries = lelamStore.getEntries();
    const rankedStore = sortLeaderboard(storeEntries);
    const storeStats = lelamStore.getStats();
    const storeActivities = lelamStore.getActivity();

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: 2,
        totalEntries: storeEntries.length,
        activeEntries: storeEntries.filter((e) => e.status === 'active').length,
        pendingEntries: storeEntries.filter((e) => e.status !== 'active').length,
        verifiedPaymentsCount: storeStats.totalVerifiedBids,
        pendingPaymentsCount: 0,
        totalVerifiedVolume: storeStats.totalBidVolume,
        championBid: storeStats.championBid,
        championName: storeStats.championName,
      },
      entries: rankedStore.map((e) => ({
        ...e,
        owner_email: 'founder@example.com',
        owner_name: 'Store Founder',
      })),
      pendingPayments: [],
      verifiedPayments: [],
      users: [
        {
          id: 'admin-1',
          email: 'admin@lelamrank.in',
          username: 'admin',
          full_name: 'Platform Admin',
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      ],
      activities: storeActivities,
    });
  } catch (error: unknown) {
    console.error('[Admin data API error]:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve admin data.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
