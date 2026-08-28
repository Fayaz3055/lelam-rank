'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import { Entry } from '@/types';
import { formatINR, getCategoryTag } from '@/lib/ranking';

interface LeaderboardRowProps {
  entry: Entry;
  rank: number;
  onBid: (entry: Entry) => void;
}

export default function LeaderboardRow({ entry, rank, onBid }: LeaderboardRowProps) {
  const formattedRank = rank < 10 ? `0${rank}` : `${rank}`;
  const isTop3 = rank <= 3;
  const category = getCategoryTag(entry);

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'AI':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'SAAS':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      case 'FINTECH':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'BUSINESS':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'DEVTOOLS':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      default:
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    }
  };

  return (
    <div
      className={`group relative rounded-xl transition-all duration-200 border ${
        rank === 1
          ? 'bg-gradient-to-r from-amber-500/[0.08] via-[#12141D] to-[#0E1017] border-amber-500/40 shadow-lg shadow-amber-500/5'
          : isTop3
          ? 'bg-[#12141D] border-white/[0.1] hover:border-amber-500/30'
          : 'bg-[#0E1017] border-white/[0.06] hover:border-white/[0.15]'
      } p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
    >
      {/* Rank & Profile Details */}
      <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto min-w-0 flex-1">
        {/* Rank Number */}
        <div
          className={`font-mono text-base sm:text-lg font-black w-8 shrink-0 ${
            rank === 1 ? 'text-[#E5C158]' : isTop3 ? 'text-slate-200' : 'text-slate-400'
          }`}
        >
          #{formattedRank}
        </div>

        {/* Logo / Avatar */}
        <div className="w-12 h-12 rounded-xl bg-[#08090C] border border-white/[0.1] overflow-hidden shrink-0 flex items-center justify-center shadow-md">
          {entry.logo_url ? (
            <Image
              src={entry.logo_url}
              alt={entry.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className={`text-base font-bold ${
                rank === 1 ? 'text-[#E5C158]' : 'text-white'
              }`}
            >
              {entry.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name & Pitch */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${entry.slug}`}
              className="text-base font-bold text-white hover:text-[#E5C158] transition-colors truncate"
            >
              {entry.name}
            </Link>

            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase font-mono tracking-wider ${getCategoryBadgeClass(
                category
              )}`}
            >
              {category}
            </span>

            {rank === 1 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-[#E5C158] border border-amber-500/30 font-bold uppercase font-mono flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>#1 APEX</span>
              </span>
            )}

            {entry.website_url && (
              <a
                href={entry.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white"
                title="Visit website"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <p className="text-xs text-slate-400 truncate max-w-lg mt-0.5">
            {entry.description}
          </p>
        </div>
      </div>

      {/* Bid Amount & Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05] shrink-0">
        <div className="text-left sm:text-right">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
            VERIFIED BID
          </div>
          <div
            className={`text-lg sm:text-xl font-black font-mono ${
              rank === 1 ? 'text-[#E5C158]' : 'text-white'
            }`}
          >
            {formatINR(entry.current_bid)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${entry.slug}`}
            className="px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            View
          </Link>
          <button
            onClick={() => onBid(entry)}
            className="px-3.5 py-2 rounded-lg gold-gradient-button text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Zap className="w-3 h-3" />
            <span>Take Spot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
