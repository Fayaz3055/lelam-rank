import { Entry, Bid } from '@/types';

/**
 * Formats a number into Indian Rupee currency format (e.g. ₹12,500)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Deterministic Leaderboard Sorting:
 * 1. Highest verified bid amount (DESC)
 * 2. If amounts are equal: earlier verified timestamp wins (ASC)
 * 3. If still equal: earlier entry creation wins (ASC)
 */
export function sortLeaderboard(entries: Entry[]): Entry[] {
  const activeEntries = entries.filter((e) => e.status === 'active');

  const sorted = [...activeEntries].sort((a, b) => {
    // Primary: highest bid
    if (b.current_bid !== a.current_bid) {
      return b.current_bid - a.current_bid;
    }

    // Secondary: earlier timestamp wins
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // Tertiary: creation timestamp
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return sorted.map((entry, index) => ({
    ...entry,
    current_rank: index + 1,
  }));
}

/**
 * Live Rank Calculator:
 * Simulates and calculates the exact rank an entry will achieve with a specific bid amount.
 * - Handles both new entries and existing entries upgrading their bid.
 */
export function calculateEstimatedRank(
  bidAmount: number,
  currentRankedEntries: Entry[],
  currentEntryId?: string
): number {
  if (!bidAmount || bidAmount < 50) {
    return currentRankedEntries.length + 1;
  }

  // Filter out the current entry if it's an existing one updating its bid
  const otherEntries = currentRankedEntries.filter(
    (e) => e.id !== currentEntryId && e.status === 'active'
  );

  // Find how many entries have a higher current bid
  let higherBidsCount = 0;
  for (const entry of otherEntries) {
    if (entry.current_bid > bidAmount) {
      higherBidsCount++;
    } else if (entry.current_bid === bidAmount) {
      // New bid at same amount has later timestamp, so existing entry stays higher
      higherBidsCount++;
    }
  }

  return higherBidsCount + 1;
}

/**
 * Relative time helper for microcopy and activity logs
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}
