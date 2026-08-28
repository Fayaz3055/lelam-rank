'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { Entry } from '@/types';
import { formatINR, getCategoryTag } from '@/lib/ranking';
import BidModal from '@/components/bidding/BidModal';

interface PodiumProps {
  entries: Entry[];
}

export default function Podium({ entries }: PodiumProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  // Visual rank themes
  const podiumStyles = [
    {
      rank: 1,
      border: 'border-amber-400/50',
      bg: 'bg-gradient-to-b from-[#181B26] to-[#0D0F15]',
      badgeBg: 'bg-gradient-to-r from-amber-400 to-amber-600 text-black',
      textColor: 'text-[#E5C158]',
      title: 'CHAMPION',
      orderClass: 'order-1 md:order-2 md:-mt-3',
    },
    {
      rank: 2,
      border: 'border-slate-400/40',
      bg: 'bg-gradient-to-b from-[#13151D] to-[#0A0C11]',
      badgeBg: 'bg-gradient-to-r from-slate-300 to-slate-400 text-black',
      textColor: 'text-slate-200',
      title: 'RUNNER UP',
      orderClass: 'order-2 md:order-1',
    },
    {
      rank: 3,
      border: 'border-amber-700/40',
      bg: 'bg-gradient-to-b from-[#13151D] to-[#0A0C11]',
      badgeBg: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white',
      textColor: 'text-amber-500',
      title: 'CONTENDER',
      orderClass: 'order-3 md:order-3',
    },
  ];

  const handleBidClick = (entry: Entry) => {
    setSelectedEntry(entry);
    setBidModalOpen(true);
  };

  return (
    <>
      <section className="py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-[#E5C158]">
              THE APEX CONTENDERS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              Top 3 Podium
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end max-w-5xl mx-auto">
            {top3.map((entry, idx) => {
              const style = podiumStyles[idx] || podiumStyles[2];
              return (
                <div
                  key={entry.id}
                  className={`relative rounded-2xl ${style.bg} border-2 ${style.border} p-5 sm:p-6 text-center shadow-xl ${style.orderClass} transition-transform hover:-translate-y-1`}
                >
                  {/* Rank Header Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded ${style.badgeBg}`}>
                      #{style.rank}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {style.title}
                    </span>
                  </div>

                  {/* Logo Avatar */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#08090C] border border-white/[0.1] overflow-hidden mx-auto mb-3 flex items-center justify-center shadow-inner">
                    {entry.logo_url ? (
                      <Image
                        src={entry.logo_url}
                        alt={entry.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name & Bid */}
                  <div className="mb-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300">
                      {getCategoryTag(entry)}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white truncate px-2 mt-1">
                      {entry.name}
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                    {entry.description}
                  </p>

                  <div className={`text-xl sm:text-2xl font-black ${style.textColor} mb-3 font-mono`}>
                    {formatINR(entry.current_bid)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                    <Link
                      href={`/${entry.slug}`}
                      className="flex-1 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleBidClick(entry)}
                      className="flex-1 py-2 rounded-lg gold-gradient-button text-black font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer"
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
