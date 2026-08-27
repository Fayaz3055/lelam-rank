'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, Trophy } from 'lucide-react';
import ChampionCard from '@/components/home/ChampionCard';
import Podium from '@/components/home/Podium';
import StatsBar from '@/components/home/StatsBar';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import ActivityFeed from '@/components/home/ActivityFeed';
import { dbService } from '@/services/db';
import { subscribeToLeaderboard } from '@/lib/realtime';
import { Entry, ActivityEvent, LeaderboardStats } from '@/types';

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

  const loadData = async () => {
    const [eList, aList, sData] = await Promise.all([
      dbService.getLeaderboardEntries(),
      dbService.getActivityFeed(),
      dbService.getStats(),
    ]);
    setEntries(eList);
    setActivities(aList);
    setStats(sData);
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

  const champion = entries[0] || null;

  return (
    <div className="space-y-8 pb-16 pt-4 sm:pt-6">
      {/* 1. Compact Live Leaderboard Top Header Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] uppercase font-mono tracking-widest text-[#E5C158] font-bold">
                  LIVE RANKING BOARD • KERALA
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Where Kerala startups, businesses & products compete for #1
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/create"
              className="gold-gradient-button text-black font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/15"
            >
              <span>CLAIM YOUR SPOT (₹50 MIN)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Current Reigning Champion / #1 */}
      <section className="pt-2">
        <ChampionCard champion={champion} />
      </section>

      {/* 3. Top 3 Podium */}
      {entries.length >= 2 && <Podium entries={entries} />}

      {/* 4. Real Stats Bar */}
      <StatsBar stats={stats} />

      {/* 5. Top 10 Leaderboard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <LeaderboardTable
          entries={entries}
          limit={10}
          title="Top 10 Leaderboard"
          subtitle="Real-time rankings determined by verified bid amount and payment timestamp"
        />
      </section>

      {/* 6. Genuine Activity Feed */}
      <ActivityFeed activities={activities} />

      {/* 7. How It Works / The Mechanism */}
      <section className="py-12 border-t border-white/[0.06] bg-[#0A0C11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#E5C158]">
              THE MECHANISM
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              How LELAM RANK Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              A transparent, high-stakes visibility engine built for serious founders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="rounded-2xl bg-[#10121A] border border-white/[0.08] p-5 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-bold font-mono text-xs mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">1. Create Entry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your startup, SaaS, AI product, or business profile with a verified pitch and links.
              </p>
            </div>

            <div className="rounded-2xl bg-[#10121A] border border-white/[0.08] p-5 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-bold font-mono text-xs mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">2. Place Your Bid</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter any amount starting at ₹50. No artificial cap. The bid itself is your verified entry payment.
              </p>
            </div>

            <div className="rounded-2xl bg-[#10121A] border border-white/[0.08] p-5 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-bold font-mono text-xs mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">3. Deterministic Rank</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backend immediately places you in your rightful spot. Tied amounts resolved by earlier payment.
              </p>
            </div>

            <div className="rounded-2xl bg-[#10121A] border border-white/[0.08] p-5 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-bold font-mono text-xs mb-3">
                04
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">4. Share & Outbid</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate branded viral rank assets. If someone outbids you, you stay live and can outbid them back.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/how-it-works"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              <span>Read Full Operational Architecture</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Main Launch / Brand CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#181B26] via-[#12141D] to-[#0A0C10] border-2 border-amber-500/40 p-8 sm:p-12 text-center overflow-hidden shadow-2xl shadow-amber-500/10">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KERALA&apos;S APEX LEADERBOARD</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight max-w-2xl mx-auto mb-3">
            Ready to Take the <br />
            <span className="gold-gradient-text">Top Position?</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
            Join the founders, SaaS creators, and emerging products commanding high-visibility spotlight across Kerala.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl gold-gradient-button text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
            >
              <span>CLAIM YOUR SPOT (₹50 MIN)</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/rules"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-xs transition-all"
            >
              READ PLATFORM RULES
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
