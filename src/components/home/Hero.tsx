'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Flame, ShieldCheck, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle Live Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-8 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            LIVE LEADERBOARD • KERALA TECH & STARTUPS
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white uppercase font-sans mb-6">
          WHO&apos;S <br />
          <span className="gold-gradient-text">ON TOP?</span>
        </h1>

        {/* Subtitle / Positioning */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-400 font-normal leading-relaxed mb-8">
          Kerala&apos;s competitive visibility leaderboard for startups, businesses, SaaS, AI tools, and emerging digital products.
        </p>

        {/* Tagline micro-element */}
        <div className="text-xs font-mono font-bold tracking-[0.25em] text-[#E5C158] uppercase mb-10">
          BID. RANK. RISE.
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Link
            href="/create"
            className="w-full sm:w-auto px-8 py-4 rounded-xl gold-gradient-button text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/15 group"
          >
            <span>CLAIM YOUR SPOT</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          <Link
            href="/leaderboard"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold text-sm transition-all"
          >
            VIEW LEADERBOARD
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#E5C158]" />
            <span>₹50 Minimum Bid</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#E5C158]" />
            <span>Deterministic Real-Time Ranking</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#E5C158]" />
            <span>Unlimited Outbidding</span>
          </div>
        </div>
      </div>
    </section>
  );
}
