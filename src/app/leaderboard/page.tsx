'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  ArrowUpRight,
  TrendingUp,
  Search,
  Zap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Flame,
  Activity,
  PlusCircle,
  Share2,
  Rocket,
  Clock,
  Layers,
  CheckCircle2,
  ArrowDown,
} from 'lucide-react';
import StatsBar from '@/components/home/StatsBar';
import BidModal from '@/components/bidding/BidModal';
import ShareModal from '@/components/share/ShareModal';
import { dbService } from '@/services/db';
import { subscribeToLeaderboard } from '@/lib/realtime';
import { Entry, ActivityEvent, LeaderboardStats } from '@/types';
import { formatINR, formatTimeAgo, getCategoryTag } from '@/lib/ranking';

export default function LeaderboardPage() {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [shareEntry, setShareEntry] = useState<Entry | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
    const unsub = subscribeToLeaderboard(loadData);
    window.addEventListener('lelam_store_updated', loadData);
    return () => {
      unsub();
      window.removeEventListener('lelam_store_updated', loadData);
    };
  }, []);

  const handleTakeSpot = (entry: Entry) => {
    setSelectedEntry(entry);
    setBidModalOpen(true);
  };

  const handleShare = (entry: Entry) => {
    setShareEntry(entry);
    setShareModalOpen(true);
  };

  // Top 3 Podium
  const top3 = useMemo(() => entries.slice(0, 3), [entries]);

  // Top 10 (Ranks #4 to #10)
  const top4to10 = useMemo(() => entries.slice(3, 10), [entries]);

  // Today's Top: Real activity items from today
  const todayActivities = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return activities.filter((act) => new Date(act.created_at).getTime() >= startOfToday.getTime());
  }, [activities]);

  // Rising Fast: Genuine rank-up jumps from activity feed (where old_rank > new_rank)
  const risingFast = useMemo(() => {
    const risingMap = new Map<
      string,
      {
        entryName: string;
        entrySlug: string;
        gain: number;
        oldRank: number;
        newRank: number;
        amount: number;
        createdAt: string;
      }
    >();
    for (const act of activities) {
      if (act.event_type === 'rank_up' && act.old_rank && act.old_rank > act.new_rank) {
        const gain = act.old_rank - act.new_rank;
        if (!risingMap.has(act.entry_slug) || (risingMap.get(act.entry_slug)?.gain || 0) < gain) {
          risingMap.set(act.entry_slug, {
            entryName: act.entry_name,
            entrySlug: act.entry_slug,
            gain,
            oldRank: act.old_rank,
            newRank: act.new_rank,
            amount: act.amount,
            createdAt: act.created_at,
          });
        }
      }
    }
    return Array.from(risingMap.values());
  }, [activities]);

  // Newly Ranked (4–6 newest entries sorted by verified created_at)
  const newlyRanked = useMemo(() => {
    const sortedByDate = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sortedByDate.slice(0, 4);
  }, [entries]);

  // Full Leaderboard Search + Category Filtering
  const filteredEntries = useMemo(() => {
    let list = entries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.slug.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'ALL') {
      list = list.filter((e) => getCategoryTag(e) === selectedCategory);
    }
    return list;
  }, [entries, searchQuery, selectedCategory]);

  const categories = ['ALL', 'STARTUP', 'SAAS', 'AI', 'FINTECH', 'BUSINESS'];

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'AI':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'SAAS':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      case 'FINTECH':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'BUSINESS':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      default:
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    }
  };

  return (
    <div className="pt-6 sm:pt-10 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* 1. HERO SECTION */}
      <section className="space-y-6 scroll-mt-24 border-b border-white/[0.08] pb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>GLOBAL RANKING • KERALA & BEYOND</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight font-sans leading-none">
              THE GLOBAL RANKING FOR STARTUPS & BUSINESSES
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed pt-1">
              Kerala’s premier competitive leaderboard. Emerging startups, SaaS products, AI tools, and ventures compete for top visibility through 100% verified bid payments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/create"
              className="gold-gradient-button text-black font-extrabold text-sm px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Claim Your Spot</span>
            </Link>

            <a
              href="#full-leaderboard"
              className="px-5 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white text-sm font-semibold border border-white/[0.08] flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explore Rankings</span>
              <ArrowDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Real Statistics Summary */}
        <StatsBar stats={stats} />

        {/* Trust & Transparency Strip */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-8 pt-2 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Bidding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Deterministic Ranking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Transparent Rules</span>
          </div>
        </div>
      </section>

      {/* 2. TOP 3 PODIUM */}
      <section className="space-y-6 scroll-mt-24" id="top-podium">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>🏆 TOP 3</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            The current leaders of LELAM RANK
          </p>
        </div>

        {top3.length === 0 ? (
          <div className="rounded-3xl bg-[#0E1017] border border-dashed border-white/[0.12] p-12 text-center max-w-xl mx-auto">
            <Trophy className="w-8 h-8 text-amber-400/60 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No entities are ranked yet.</h3>
            <p className="text-xs text-slate-400 mb-4">Be the first to claim a position on the board.</p>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient-button text-black font-bold text-xs"
            >
              <span>Claim Spot Now</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-2">
            {/* Rank #2: Runner Up (Left on Desktop, 2nd on Mobile) */}
            {top3[1] && (
              <div className="order-2 md:order-1 rounded-2xl bg-[#0F1118] border border-slate-400/30 p-6 text-center shadow-lg hover:border-slate-300/60 transition-all relative group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-slate-300 text-black font-mono">
                    #2
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    RUNNER UP
                  </span>
                </div>

                <div className="w-16 h-16 rounded-xl bg-[#141720] border border-white/[0.1] overflow-hidden mx-auto mb-3 flex items-center justify-center">
                  {top3[1].logo_url ? (
                    <Image
                      src={top3[1].logo_url}
                      alt={top3[1].name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-slate-300">
                      {top3[1].name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div
                  className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider mb-1 ${getCategoryBadgeClass(
                    getCategoryTag(top3[1])
                  )}`}
                >
                  {getCategoryTag(top3[1])}
                </div>

                <h3 className="text-base font-bold text-white tracking-tight line-clamp-1">
                  {top3[1].name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3 h-8">
                  {top3[1].description}
                </p>

                <div className="text-xl font-black font-mono text-slate-200 mb-4">
                  {formatINR(top3[1].current_bid)}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/${top3[1].slug}`}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleTakeSpot(top3[1])}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Take Spot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rank #1: Champion (Dominant Center on Desktop, 1st on Mobile) */}
            {top3[0] && (
              <div className="order-1 md:order-2 md:-mt-4 rounded-2xl bg-gradient-to-b from-[#181B26] to-[#0D0F16] border-2 border-amber-400/80 p-7 text-center shadow-xl shadow-amber-500/10 hover:border-amber-400 transition-all relative group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md shadow-amber-500/20">
                  <Trophy className="w-3 h-3" />
                  <span>CHAMPION</span>
                </div>

                <div className="flex justify-between items-center mt-1 mb-3">
                  <span className="text-sm font-black px-3 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-amber-600 text-black font-mono shadow">
                    #1
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>APEX HOLDER</span>
                  </span>
                </div>

                <div className="w-20 h-20 rounded-2xl bg-[#08090C] border-2 border-amber-400/40 overflow-hidden mx-auto mb-3 flex items-center justify-center shadow-md">
                  {top3[0].logo_url ? (
                    <Image
                      src={top3[0].logo_url}
                      alt={top3[0].name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-amber-400">
                      {top3[0].name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div
                  className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-extrabold uppercase tracking-wider mb-1 ${getCategoryBadgeClass(
                    getCategoryTag(top3[0])
                  )}`}
                >
                  {getCategoryTag(top3[0])}
                </div>

                <h3 className="text-lg font-black text-white tracking-tight line-clamp-1">
                  {top3[0].name}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1 mb-3 h-8">
                  {top3[0].description}
                </p>

                <div className="text-3xl font-black font-mono text-[#E5C158] mb-4">
                  {formatINR(top3[0].current_bid)}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/${top3[0].slug}`}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-bold text-white transition-colors"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => handleTakeSpot(top3[0])}
                    className="flex-1 py-2.5 rounded-xl gold-gradient-button text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Outbid #1</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rank #3: Contender (Right on Desktop, 3rd on Mobile) */}
            {top3[2] && (
              <div className="order-3 rounded-2xl bg-[#0F1118] border border-amber-700/40 p-6 text-center shadow-lg hover:border-amber-600/60 transition-all relative group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-amber-700 text-white font-mono">
                    #3
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    CONTENDER
                  </span>
                </div>

                <div className="w-16 h-16 rounded-xl bg-[#141720] border border-white/[0.1] overflow-hidden mx-auto mb-3 flex items-center justify-center">
                  {top3[2].logo_url ? (
                    <Image
                      src={top3[2].logo_url}
                      alt={top3[2].name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-amber-500">
                      {top3[2].name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div
                  className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider mb-1 ${getCategoryBadgeClass(
                    getCategoryTag(top3[2])
                  )}`}
                >
                  {getCategoryTag(top3[2])}
                </div>

                <h3 className="text-base font-bold text-white tracking-tight line-clamp-1">
                  {top3[2].name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3 h-8">
                  {top3[2].description}
                </p>

                <div className="text-xl font-black font-mono text-amber-400 mb-4">
                  {formatINR(top3[2].current_bid)}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/${top3[2].slug}`}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleTakeSpot(top3[2])}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors border border-amber-500/20"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Take Spot</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. TODAY'S TOP */}
      <section className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              🔥 TODAY&apos;S TOP
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Today&apos;s Verified Highlights</span>
        </div>

        {todayActivities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayActivities.slice(0, 3).map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between hover:border-amber-500/30 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-white">{act.entry_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {act.event_type === 'rank_up'
                      ? `Rose to #${act.new_rank}`
                      : `Verified Bid ${formatINR(act.amount)}`}
                  </div>
                </div>
                <Link
                  href={`/${act.entry_slug}`}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center rounded-xl bg-[#141720]/40 border border-dashed border-white/[0.06]">
            <p className="text-xs text-slate-400">No major rank movements today yet.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Be the first to shake up the rankings.</p>
          </div>
        )}
      </section>

      {/* 4. TOP 10 (Ranks #4 through #10) */}
      {top4to10.length > 0 && (
        <section className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>⚡ TOP 10</span>
              </h2>
              <p className="text-xs text-slate-400">The ten entities currently dominating the board.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Ranks #4 – #10</span>
          </div>

          <div className="space-y-2.5">
            {top4to10.map((entry) => {
              const formattedRank = String(entry.current_rank || 4).padStart(2, '0');
              return (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-xs font-black font-mono text-slate-400">
                      {formattedRank}
                    </span>

                    <div className="w-10 h-10 rounded-lg bg-[#08090C] border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
                      {entry.logo_url ? (
                        <Image
                          src={entry.logo_url}
                          alt={entry.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {entry.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${entry.slug}`}
                          className="text-xs sm:text-sm font-bold text-white hover:text-[#E5C158] transition-colors"
                        >
                          {entry.name}
                        </Link>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase font-mono ${getCategoryBadgeClass(
                            getCategoryTag(entry)
                          )}`}
                        >
                          {getCategoryTag(entry)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                        {entry.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Current Bid</span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">
                        {formatINR(entry.current_bid)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShare(entry)}
                        className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Share Rank"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/${entry.slug}`}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleTakeSpot(entry)}
                        className="px-3 py-1.5 rounded-lg gold-gradient-button text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Take Spot</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. RISING FAST */}
      <section className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              🚀 RISING FAST
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Verified Rank Surges</span>
        </div>

        {risingFast.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {risingFast.slice(0, 3).map((r, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between hover:border-emerald-500/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      #{r.oldRank} → #{r.newRank}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                      +{r.gain}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">{r.entryName}</div>
                  <div className="text-[11px] font-mono text-amber-400 font-bold mt-0.5">
                    {formatINR(r.amount)}
                  </div>
                </div>
                <Link
                  href={`/${r.entrySlug}`}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center rounded-xl bg-[#141720]/40 border border-dashed border-white/[0.06]">
            <p className="text-xs text-slate-400">No major rank movements yet.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Watch this space.</p>
          </div>
        )}
      </section>

      {/* 6. FULL LEADERBOARD */}
      <section className="space-y-4 scroll-mt-24" id="full-leaderboard">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>📊 FULL LEADERBOARD</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The complete, deterministic directory of all {filteredEntries.length} verified ranked contenders.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <label htmlFor="search-leaderboard" className="sr-only">
              Search startups, businesses, products
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="search-leaderboard"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search startups, businesses, products..."
              className="w-full bg-[#10121A] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-[#E5C158] border border-amber-500/40 shadow-sm'
                  : 'bg-[#141720] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Directory Rows */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl bg-[#0E1017] border border-dashed border-white/[0.15] p-10 text-center">
            <Trophy className="w-8 h-8 text-amber-400/60 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">
              {searchQuery ? 'No matching entities found' : 'The board is ready'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Try searching with another keyword or clearing category filters.'
                : 'Be the first contender to claim a spot on the live Kerala leaderboard.'}
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient-button text-black font-extrabold text-xs shadow-md shadow-amber-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Claim Spot Now</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0E1017] border border-white/[0.08] hover:border-white/[0.15] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 text-xs font-black font-mono text-slate-300">
                    #{entry.current_rank}
                  </span>

                  <div className="w-10 h-10 rounded-lg bg-[#141720] border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
                    {entry.logo_url ? (
                      <Image
                        src={entry.logo_url}
                        alt={entry.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-amber-400">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${entry.slug}`}
                        className="text-xs sm:text-sm font-bold text-white hover:text-[#E5C158] transition-colors"
                      >
                        {entry.name}
                      </Link>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase font-mono ${getCategoryBadgeClass(
                          getCategoryTag(entry)
                        )}`}
                      >
                        {getCategoryTag(entry)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                      {entry.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <div className="text-left sm:text-right">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono">Current Bid</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-[#E5C158]">
                      {formatINR(entry.current_bid)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/${entry.slug}`}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => handleTakeSpot(entry)}
                      className="px-3 py-1.5 rounded-lg gold-gradient-button text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Take Spot</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. NEWLY RANKED & LIVE ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
        {/* Newly Ranked */}
        <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                🆕 NEWLY RANKED
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Recent Entrants</span>
          </div>

          {newlyRanked.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {newlyRanked.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.15] transition-colors"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        Rank #{entry.current_rank}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase ${getCategoryBadgeClass(
                          getCategoryTag(entry)
                        )}`}
                      >
                        {getCategoryTag(entry)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{entry.name}</h4>
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.06]">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {formatINR(entry.current_bid)}
                    </span>
                    <Link
                      href={`/${entry.slug}`}
                      className="text-[11px] text-slate-300 hover:text-white font-semibold flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center rounded-xl bg-[#141720]/40 border border-dashed border-white/[0.06]">
              <p className="text-xs text-slate-400">No new entities have joined recently.</p>
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#E5C158]" />
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                ⚡ LIVE ACTIVITY
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Verified Stream</span>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-2.5">
              {activities.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#141720] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white mr-1.5">{act.entry_name}</span>
                      <span className="text-[11px] text-slate-400">
                        {act.event_type === 'rank_up'
                          ? `rose to #${act.new_rank}`
                          : act.event_type === 'new_entry'
                          ? `claimed #${act.new_rank}`
                          : `placed verified bid`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-xs font-mono font-bold text-[#E5C158]">
                      {formatINR(act.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatTimeAgo(act.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center rounded-xl bg-[#141720]/40 border border-dashed border-white/[0.06]">
              <p className="text-xs text-slate-400">No recent verified activity.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reused Modals */}
      {selectedEntry && (
        <BidModal
          entry={selectedEntry}
          isOpen={bidModalOpen}
          onClose={() => {
            setBidModalOpen(false);
            setSelectedEntry(null);
          }}
          onSuccess={loadData}
        />
      )}

      {shareEntry && (
        <ShareModal
          entry={shareEntry}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareEntry(null);
          }}
        />
      )}
    </div>
  );
}
