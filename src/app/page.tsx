'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, Trophy, ArrowDown, ShieldCheck, Zap, Flame } from 'lucide-react';
import ChampionCard from '@/components/home/ChampionCard';
import StatsBar from '@/components/home/StatsBar';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import { dbService } from '@/services/db';
import { subscribeToLeaderboard } from '@/lib/realtime';
import { Entry, LeaderboardStats } from '@/types';

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
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
      const [eList, sData] = await Promise.all([
        dbService.getLeaderboardEntries(),
        dbService.getStats(),
      ]);
      setEntries(eList);
      setStats(sData);
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

  return (
    <div className="space-y-12 pb-20 pt-4 sm:pt-6">
      {/* 1. Hero & Branding Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-white/[0.08]">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>GLOBAL RANKING • KERALA & BEYOND</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none font-sans">
              THE GLOBAL RANKING FOR <br />
              <span className="gold-gradient-text">STARTUPS & BUSINESSES</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed pt-1">
              Where Kerala startups, SaaS tools, AI ventures, and emerging digital products compete for apex visibility through 100% verified bid payments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/create"
              className="gold-gradient-button text-black font-extrabold text-sm px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
            >
              <span>Claim Your Spot</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <a
              href="#leaderboard-section"
              className="px-5 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white text-sm font-semibold border border-white/[0.08] flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explore Rankings</span>
              <ArrowDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Compact Trust & Transparency Indicators */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-8 pt-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#E5C158]" />
            <span>₹50 Minimum Bid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Real-Time Ranking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>100% Verified Transactions</span>
          </div>
        </div>
      </section>

      {/* 2. Current Reigning Champion / #1 Spot */}
      <section className="pt-2">
        <ChampionCard champion={champion} />
      </section>

      {/* 3. Compact Statistics Bar */}
      <StatsBar stats={stats} />

      {/* 4. THE ONE MAIN LEADERBOARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <LeaderboardTable
          entries={entries}
          title="LELAM RANK"
          subtitle="Real-time rankings determined by verified bid amount and payment timestamp."
        />
      </section>

      {/* 5. How It Works / The Mechanism */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl bg-[#10121A] border border-white/[0.08] p-5 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-bold font-mono text-xs mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">1. Create Entry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your startup, SaaS, AI product, or business profile with a pitch and verified links.
              </p>
            </div>

            <div className="rounded-2xl bg-[#10121A] border border-white/[0.08] p-5 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-bold font-mono text-xs mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">2. Place Your Bid</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter any amount starting at ₹50. No artificial cap. The bid itself is your entry payment.
              </p>
            </div>

            <div className="rounded-2xl bg-[#10121A] border border-white/[0.08] p-5 relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-bold font-mono text-xs mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">3. Deterministic Rank</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backend immediately places you in your rightful spot. Equal amounts resolved by earlier payment.
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

      {/* 6. Main Launch / Brand CTA Section */}
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
