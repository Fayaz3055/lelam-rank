import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Subscribes to real-time database updates for entries, bids, and activity
 */
export function subscribeToLeaderboard(onUpdate: () => void) {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured) {
    // Return empty unsubscribe function in local/fallback mode
    return () => {};
  }

  const channel = supabase
    .channel('public:leaderboard_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'entries' },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bids' },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity' },
      () => onUpdate()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
