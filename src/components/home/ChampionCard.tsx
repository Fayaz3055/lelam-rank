'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, ArrowUpRight, Swords, ExternalLink, ShieldCheck } from 'lucide-react';
import { Entry } from '@/types';
import { formatINR, getCategoryTag, formatTimeAgo } from '@/lib/ranking';
import BidModal from '@/components/bidding/BidModal';

interface ChampionCardProps {
  champion: Entry | null;
}

export default function ChampionCard({ champion }: ChampionCardProps) {
  const [bidModalOpen, setBidModalOpen] = useState(false);

  if (!champion) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl bg-[#0F1117] border border-dashed border-white/[0.15] p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">THE #1 SPOT IS OPEN</h3>
          <p className="text-xs text-slate-400 mb-5">
            Be the first startup or product to claim the reigning position in Kerala.
          </p>
          <Link
            href="/create"
            className="gold-gradient-button text-black font-bold text-xs px-5 py-2.5 rounded-lg inline-flex items-center gap-1.5"
          >
            <span>Claim The Crown (₹50 Min)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#161925] to-[#0D0F15] border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 overflow-hidden">
          {/* Subtle gold glow flare */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

          {/* Top Bar Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#E5C158]">
                CURRENT REIGNING CHAMPION
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>VERIFIED #1</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Logo & Info */}
            <div className="md:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#08090C] border-2 border-amber-500/40 overflow-hidden flex items-center justify-center shadow-lg">
                  {champion.logo_url ? (
                    <Image
                      src={champion.logo_url}
                      alt={champion.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-[#E5C158]">
                      {champion.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-md">
                  #1
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[#E5C158] font-bold">
                    {getCategoryTag(champion)}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {champion.name}
                  </h3>
                  {champion.website_url && (
                    <a
                      href={champion.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      title="Visit website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-lg leading-relaxed">
                  {champion.description}
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-4 text-xs">
                  <Link
                    href={`/${champion.slug}`}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <span>View Public Profile</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>

                  <span className="text-[11px] font-mono text-slate-400">
                    Verified {formatTimeAgo(champion.updated_at || champion.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bid Display & Challenge CTA */}
            <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center bg-black/40 p-4 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                REIGNING BID
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#E5C158] my-0.5 font-mono">
                {formatINR(champion.current_bid)}
              </div>
              <span className="text-[11px] text-slate-400 mb-3">
                Minimum outbid: {formatINR(champion.current_bid + 1)}
              </span>

              <button
                onClick={() => setBidModalOpen(true)}
                className="w-full py-2.5 rounded-lg gold-gradient-button text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>CHALLENGE #1</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BidModal
        entry={champion}
        isOpen={bidModalOpen}
        onClose={() => setBidModalOpen(false)}
      />
    </>
  );
}
