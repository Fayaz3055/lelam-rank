import React from 'react';
import Link from 'next/link';
import { Trophy, Target, ShieldCheck, ArrowUpRight, Award, Compass } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-3">
          <Trophy className="w-3.5 h-3.5" />
          <span>ORIGIN & MISSION</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          About LELAM RANK
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">
          “Bid. Rank. Rise.”
        </p>
      </div>

      {/* Main Narrative */}
      <div className="rounded-3xl bg-[#0E1017] border border-white/[0.08] p-8 sm:p-12 space-y-6 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Kerala’s Competitive Leaderboard for Startups & Digital Products
        </h2>

        <p>
          Kerala is home to thousands of brilliant software engineers, SaaS innovators, AI researchers, and digital product builders. However, getting sustained early visibility is often difficult amidst crowded traditional directories and algorithm-controlled platforms.
        </p>

        <p>
          <strong className="text-white">LELAM RANK</strong> was created to solve visibility with a radically transparent, game-mechanic approach: a single global leaderboard where position is backed 100% by verified bids.
        </p>

        <div className="p-5 rounded-2xl bg-[#141720] border border-amber-500/20 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#E5C158] font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Clear & Honest Positioning</span>
          </div>
          <p className="text-slate-300">
            LELAM RANK is a competitive visibility showcase. We do not make misleading claims of guaranteed conversions, traffic, or investor funding. What we provide is an un-manipulated, public ranking where any builder can outbid the competition and claim the spotlight.
          </p>
        </div>

        <h3 className="text-lg font-bold text-white pt-4">Core Pillars</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Deterministic Engine</span>
            </h4>
            <p className="text-xs text-slate-400">
              Rankings are calculated strictly by database verified payments. No secret algorithms, no sponsored shadow boosts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#E5C158]" />
              <span>Permanent Board Presence</span>
            </h4>
            <p className="text-xs text-slate-400">
              Your entry is permanent. Being outbid simply adjusts your rank; your project never vanishes into thin air.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="text-center pt-4">
        <Link
          href="/create"
          className="gold-gradient-button text-black font-extrabold text-xs px-8 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-xl shadow-amber-500/15"
        >
          <span>Claim Your Spot (₹50 Min)</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
