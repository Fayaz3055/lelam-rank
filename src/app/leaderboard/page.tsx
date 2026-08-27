'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ArrowUpRight } from 'lucide-react';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import StatsBar from '@/components/home/StatsBar';
import { dbService } from '@/services/db';
import { subscribeToLeaderboard } from '@/lib/realtime';
import { Entry, LeaderboardStats } from '@/types';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    championBid: 0,
    championName: '',
    championSlug: '',
    totalEntries: 0,
    totalBidVolume: 0,
    totalVerifiedBids: 0,
  });

  const loadData = async () => {
    const [eList, sData] = await Promise.all([
      dbService.getLeaderboardEntries(),
      dbService.getStats(),
    ]);
    setEntries(eList);
    setStats(sData);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToLeaderboard(loadData);
    window.addEventListener('lelam_store_updated', loadData);
    return () => {
      unsub();
      window.removeEventListener('lelam_store_updated', loadData);
    };
  }, []);

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>GLOBAL SINGLE BOARD • KERALA TECH</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Full Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl">
            Every active startup, SaaS, AI venture, and digital product ranked purely by verified bid payments.
          </p>
        </div>

        <Link
          href="/create"
          className="gold-gradient-button text-black font-extrabold text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 self-start md:self-auto shadow-lg shadow-amber-500/15"
        >
          <span>Claim Your Spot (₹50 Min)</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Summary */}
      <StatsBar stats={stats} />

      {/* Full Leaderboard Table with Search */}
      <LeaderboardTable
        entries={entries}
        title="Active Rankings"
        subtitle="Search across all competing Kerala and global entities"
      />
    </div>
  );
}
