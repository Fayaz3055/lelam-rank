'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, Trophy, ArrowDown, ShieldCheck, Zap, Flame } from 'lucide-react';
import ChampionCard from '@/components/home/ChampionCard';
import Podium from '@/components/home/Podium';
import TodaysTop from '@/components/home/TodaysTop';
import Top10Table from '@/components/leaderboard/Top10Table';
import StatsBar from '@/components/home/StatsBar';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import { dbService } from '@/services/db';
import { subscribeToLeaderboard } from '@/lib/realtime';
import { Entry, LeaderboardStats, ActivityEvent } from '@/types';

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    championBid: 0,
    championName: '',
    championSlug: '',
    totalEntries: 0,
    totalBidVolume: 0,
    totalVerifiedBids: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [eList, sData, aList] = await Promise.all([
        dbService.getLeaderboardEntries(),
        dbService.getStats(),
        dbService.getActivityFeed(10),
      ]);
      setEntries(eList);
      setStats(sData);
      setActivities(aList);
    } catch (err) {
      console.error('[Error loading leaderboard]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubRealtime = subscribeToLeaderboard(loadData);
    window.addEventListener('lelam_store_updated', loadData);
    return () => {
      unsubRealtime();
      window.removeEventListener('lelam_store_updated', loadData);
    };
  }, []);

  const champion = entries.find((e) => e.status === 'active') || null;
  const hasMultipleEntries = entries.length >= 2;

  return (
    <div className="space-y-10 pb-20 pt-2 sm:pt-4">
      {/* 1. Hero & Branding Section (Tightened Hierarchy) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="max-w-3xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>GLOBAL RANKING • KERALA & BEYOND</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight font-sans">
              THE GLOBAL RANKING FOR <br />
              <span className="gold-gradient-text">STARTUPS & BUSINESSES</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Where Kerala startups, SaaS tools, AI ventures, and emerging digital products compete for apex visibility through 100% verified bid payments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/create"
              className="gold-gradient-button text-black font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
            >
              <span>Claim Your Spot</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <a
              href="#leaderboard-directory"
              className="px-5 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white text-xs sm:text-sm font-semibold border border-white/[0.08] flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explore Rankings</span>
              <ArrowDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Compact Trust & Transparency Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 pt-3 text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>₹50 Minimum Bid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deterministic Real-Time Ranking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>100% Verified Transactions</span>
          </div>
        </div>
      </section>

      {/* 2. Current Reigning Champion / #1 Spot Card */}
      <section className="pt-1">
        <ChampionCard champion={champion} />
      </section>

      {/* 3. Dedicated Top 3 Podium (renders when 2+ entries exist) */}
      {hasMultipleEntries && (
        <section className="pt-1">
          <Podium entries={entries} />
        </section>
      )}

      {/* 4. Compact Statistics Bar */}
      <StatsBar stats={stats} />

      {/* 5. Today's Top Contenders */}
      {entries.length > 0 && (
        <TodaysTop entries={entries} activities={activities} />
      )}

      {/* 6. Elite Standings — Top 10 Leaderboard */}
      {entries.length > 0 && (
        <Top10Table entries={entries} />
      )}

      {/* 7. Complete Searchable All Entries Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2" id="leaderboard-directory">
        <LeaderboardTable
          entries={entries}
          title="All Ranked Contenders"
          subtitle="Search, filter by category, and browse the full deterministic directory."
        />
      </section>

      {/* 8. Main Launch / Brand CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#181B26] via-[#12141D] to-[#0A0C10] border-2 border-amber-500/40 p-6 sm:p-10 text-center overflow-hidden shadow-2xl shadow-amber-500/10">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KERALA&apos;S APEX LEADERBOARD</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight max-w-2xl mx-auto mb-2">
            Ready to Take the <span className="gold-gradient-text">Top Position?</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-5 leading-relaxed">
            Join the founders, SaaS creators, and emerging products commanding high-visibility spotlight across Kerala.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/create"
              className="w-full sm:w-auto px-6 py-3 rounded-xl gold-gradient-button text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
            >
              <span>CLAIM YOUR SPOT (₹50 MIN)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/rules"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-xs transition-all"
            >
              READ RULES
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
