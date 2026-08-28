'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, ArrowUpRight, Zap, ShieldCheck } from 'lucide-react';
import { Entry } from '@/types';
import { formatINR, getCategoryTag } from '@/lib/ranking';
import BidModal from '@/components/bidding/BidModal';

interface Top10TableProps {
  entries: Entry[];
}

export default function Top10Table({ entries }: Top10TableProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  const top10 = entries.slice(0, 10);

  if (top10.length === 0) return null;

  const handleBid = (entry: Entry) => {
    setSelectedEntry(entry);
    setBidModalOpen(true);
  };

  return (
    <>
      <section className="py-2" id="top-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 pb-2 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-extrabold tracking-widest text-[#E5C158]">
                  ELITE STANDINGS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[#E5C158] font-mono">
                  Top 10 Leaders
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 uppercase">
                Apex 10 Leaderboard
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Deterministic ranking • Real-time verified bids
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D0F15] shadow-xl">
            <div className="divide-y divide-white/[0.05]">
              {top10.map((entry, idx) => {
                const rank = entry.current_rank || idx + 1;
                const isChampion = rank === 1;
                const category = getCategoryTag(entry);

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3.5 sm:p-4 hover:bg-white/[0.02] transition-colors ${
                      isChampion ? 'bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    {/* Rank & Details */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                          rank === 1
                            ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md'
                            : rank === 2
                            ? 'bg-slate-300 text-black'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/[0.05] text-slate-400 border border-white/[0.08]'
                        }`}
                      >
                        #{rank}
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-[#08090C] border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${entry.slug}`}
                            className="text-xs sm:text-sm font-bold text-white hover:text-[#E5C158] truncate transition-colors"
                          >
                            {entry.name}
                          </Link>
                          <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06] text-slate-400">
                            {category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                          {entry.description}
                        </p>
                      </div>
                    </div>

                    {/* Verified Bid & Action */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-2">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-[#E5C158] font-mono">
                          {formatINR(entry.current_bid)}
                        </div>
                        <div className="text-[10px] text-slate-400 hidden sm:flex items-center justify-end gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Verified</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/${entry.slug}`}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                          title="View profile"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleBid(entry)}
                          className="px-2.5 py-1.5 rounded-lg gold-gradient-button text-black font-extrabold text-[10px] sm:text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          <span className="hidden sm:inline">Outbid</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
