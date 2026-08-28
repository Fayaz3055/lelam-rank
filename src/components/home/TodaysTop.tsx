'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, ArrowUpRight, Zap, Trophy, ShieldCheck } from 'lucide-react';
import { Entry, ActivityEvent } from '@/types';
import { formatINR, getCategoryTag, formatTimeAgo } from '@/lib/ranking';
import BidModal from '@/components/bidding/BidModal';

interface TodaysTopProps {
  entries: Entry[];
  activities?: ActivityEvent[];
}

export default function TodaysTop({ entries, activities = [] }: TodaysTopProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  // Identify today's entries or top movers
  const today = new Date().toISOString().slice(0, 10);
  const todaysEntries = entries.filter((e) => {
    const entryDate = (e.updated_at || e.created_at || '').slice(0, 10);
    return entryDate === today;
  });

  // If no entries specifically created today, show top active leaders as today's competitive apex
  const displayList = todaysEntries.length > 0 ? todaysEntries.slice(0, 4) : entries.slice(0, 3);

  if (displayList.length === 0) return null;

  return (
    <>
      <section className="py-2" id="todays-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 pb-2 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-[11px] uppercase font-extrabold tracking-widest text-[#E5C158]">
                  DAILY LEADER HIGHLIGHTS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 uppercase">
                Today&apos;s Top Contenders
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Deterministic ranking • 100% verified bids
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map((entry, idx) => {
              const rank = entry.current_rank || idx + 1;
              const category = getCategoryTag(entry);
              return (
                <div
                  key={entry.id}
                  className="relative rounded-2xl bg-gradient-to-b from-[#131620] to-[#0B0D13] border border-white/[0.08] hover:border-amber-500/40 p-4 sm:p-5 transition-all shadow-lg hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#08090C] border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
                        {entry.logo_url ? (
                          <Image
                            src={entry.logo_url}
                            alt={entry.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {entry.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-black text-[#E5C158]">
                            #{rank}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300">
                            {category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate mt-0.5 group-hover:text-[#E5C158] transition-colors">
                          {entry.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-slate-400">BID</div>
                      <div className="text-sm sm:text-base font-black text-[#E5C158] font-mono">
                        {formatINR(entry.current_bid)}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {entry.description}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
                    <Link
                      href={`/${entry.slug}`}
                      className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    >
                      <span>View Profile</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setBidModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg gold-gradient-button text-black font-extrabold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Outbid</span>
                    </button>
                  </div>
                </div>
              );
            })}
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
