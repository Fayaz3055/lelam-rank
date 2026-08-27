'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Trophy, ArrowUpRight, Flame, Layers } from 'lucide-react';
import { Entry } from '@/types';
import LeaderboardRow from './LeaderboardRow';
import BidModal from '@/components/bidding/BidModal';

interface LeaderboardTableProps {
  entries: Entry[];
  limit?: number;
  showSearch?: boolean;
  title?: string;
  subtitle?: string;
}

export default function LeaderboardTable({
  entries,
  limit,
  showSearch = true,
  title = 'Top 10 Contenders',
  subtitle = 'Real-time verified standings across Kerala startups and products',
}: LeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

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
    if (limit && !searchQuery.trim()) {
      list = list.slice(0, limit);
    }
    return list;
  }, [entries, searchQuery, limit]);

  const handleBid = (entry: Entry) => {
    setSelectedEntry(entry);
    setBidModalOpen(true);
  };

  return (
    <>
      <div className="w-full">
        {/* Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#E5C158]">
                GLOBAL STANDINGS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-400 font-mono">
                {entries.length} Active
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {showSearch && (
            <div className="relative w-full md:w-72">
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

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl bg-[#0E1017] border border-dashed border-white/[0.15] p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {searchQuery ? 'No matching entries found' : 'THE BOARD IS OPEN'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              {searchQuery
                ? 'Try searching with another keyword or startup name.'
                : 'Be the first to claim a spot on the leaderboard. ₹50 minimum bid.'}
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
          <div className="space-y-3">
            {filteredEntries.map((entry, index) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                rank={entry.current_rank || index + 1}
                onBid={handleBid}
              />
            ))}
          </div>
        )}

        {/* View Full Leaderboard Link when limited */}
        {limit && entries.length > limit && !searchQuery && (
          <div className="mt-8 text-center">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-slate-200 hover:text-white transition-all"
            >
              <Layers className="w-4 h-4 text-[#E5C158]" />
              <span>View All {entries.length} Contenders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
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
