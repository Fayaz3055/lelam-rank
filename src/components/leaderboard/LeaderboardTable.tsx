'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Trophy, ArrowUpRight, ChevronDown, ChevronUp, Sparkles, Filter } from 'lucide-react';
import { Entry } from '@/types';
import LeaderboardRow from './LeaderboardRow';
import BidModal from '@/components/bidding/BidModal';
import { getCategoryTag } from '@/lib/ranking';

interface LeaderboardTableProps {
  entries: Entry[];
  limit?: number;
  showSearch?: boolean;
  title?: string;
  subtitle?: string;
}

const CATEGORIES = ['ALL', 'STARTUP', 'SAAS', 'AI', 'FINTECH', 'BUSINESS'];

export default function LeaderboardTable({
  entries,
  showSearch = true,
  title = 'LELAM RANK',
  subtitle = 'Deterministic, real-time standings determined by verified bid amount and payment timestamp.',
}: LeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [displayCount, setDisplayCount] = useState<number>(10);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  // Filter by search query and category
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

  const visibleEntries = useMemo(() => {
    return filteredEntries.slice(0, displayCount);
  }, [filteredEntries, displayCount]);

  const handleBid = (entry: Entry) => {
    setSelectedEntry(entry);
    setBidModalOpen(true);
  };

  const hasMore = displayCount < filteredEntries.length;

  return (
    <>
      <div className="w-full space-y-6" id="leaderboard-section">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#E5C158]">
                LIVE DIRECTORY
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-400 font-mono">
                {filteredEntries.length} Ranked
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {/* Search Box */}
          {showSearch && (
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search startups, SaaS, AI tools..."
                className="w-full bg-[#10121A] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setDisplayCount(10);
              }}
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

        {/* Unified Leaderboard List */}
        {visibleEntries.length === 0 ? (
          <div className="rounded-2xl bg-[#0E1017] border border-dashed border-white/[0.15] p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'No matching contenders found'
                : 'THE #1 SPOT IS OPEN'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Try searching with different keywords or selecting all categories.'
                : 'Be the first entity to claim a spot on the live Kerala leaderboard. ₹50 minimum bid.'}
            </p>
            <Link
              href="/create"
              className="gold-gradient-button text-black font-extrabold text-xs px-6 py-3 rounded-xl inline-flex items-center gap-1.5"
            >
              <span>Claim Your Spot (₹50 Min)</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleEntries.map((entry) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                rank={entry.current_rank || 1}
                onBid={handleBid}
              />
            ))}
          </div>
        )}

        {/* Load More / Expand Controls */}
        {hasMore && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setDisplayCount((prev) => prev + 10)}
              className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-slate-200 hover:text-white transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4 text-[#E5C158]" />
              <span>Show More Contenders ({filteredEntries.length - displayCount} remaining)</span>
            </button>
          </div>
        )}

        {displayCount > 10 && (
          <div className="pt-2 text-center">
            <button
              onClick={() => setDisplayCount(10)}
              className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Collapse to Top 10</span>
            </button>
          </div>
        )}
      </div>

      {selectedEntry && (
        <BidModal
          entry={selectedEntry}
          isOpen={bidModalOpen}
          onClose={() => {
            setBidModalOpen(false);
            setSelectedEntry(null);
          }}
        />
      )}
    </>
  );
}
