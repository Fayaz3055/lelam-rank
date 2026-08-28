'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  ExternalLink,
  Share2,
  Zap,
  ArrowLeft,
  ShieldCheck,
  History,
  User,
  Globe,
} from 'lucide-react';
import { dbService } from '@/services/db';
import { Entry, Bid } from '@/types';
import { formatINR, formatTimeAgo, sanitizeUrl, getCategoryTag } from '@/lib/ranking';
import BidModal from '@/components/bidding/BidModal';
import ShareModal from '@/components/share/ShareModal';

export default function EntryProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const loadData = async () => {
    const found = await dbService.getEntryBySlug(slug);
    if (found) {
      setEntry(found);
      const bList = await dbService.getBidsForEntry(found.id);
      setBids(bList);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('lelam_store_updated', loadData);
    return () => window.removeEventListener('lelam_store_updated', loadData);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-[#E5C158] animate-spin"></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Spot Not Claimed Yet</h1>
        <p className="text-xs text-slate-400 mb-6">
          The slug <strong className="text-white font-mono">/{slug}</strong> is currently available.
        </p>
        <Link
          href={`/create?slug=${encodeURIComponent(slug)}`}
          className="gold-gradient-button text-black font-bold text-xs px-6 py-3 rounded-xl inline-flex items-center gap-1.5"
        >
          <span>Claim /{slug} Now (₹50 Min)</span>
        </Link>
      </div>
    );
  }

  const isTop3 = (entry.current_rank || 99) <= 3;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/leaderboard"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leaderboard</span>
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#141722] via-[#0E1017] to-[#0A0C10] border-2 border-amber-500/30 p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
            {/* Avatar & Title */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#08090C] border-2 border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                {entry.logo_url ? (
                  <Image
                    src={entry.logo_url}
                    alt={entry.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-[#E5C158]">
                    {entry.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded font-mono ${
                    entry.current_rank === 1
                      ? 'bg-amber-400 text-black'
                      : isTop3
                      ? 'bg-slate-300 text-black'
                      : 'bg-white/[0.1] text-white'
                  }`}>
                    RANK #{entry.current_rank || 'N/A'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300 font-bold uppercase font-mono">
                    {getCategoryTag(entry)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    /{entry.slug}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {entry.name}
                </h1>
              </div>
            </div>

            {/* Holding Bid */}
            <div className="bg-black/50 border border-white/[0.08] p-4 rounded-2xl text-left sm:text-right shrink-0 w-full sm:w-auto">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                CURRENT VERIFIED BID
              </div>
              <div className="text-3xl font-black text-[#E5C158] font-mono my-0.5">
                {formatINR(entry.current_bid)}
              </div>
              <div className="text-[11px] text-slate-400">
                Next minimum bid: {formatINR(entry.current_bid + 1)}
              </div>
            </div>
          </div>

          {/* Description & Links */}
          <div className="py-6 space-y-4">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
              {entry.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {sanitizeUrl(entry.website_url) && (
                <a
                  href={sanitizeUrl(entry.website_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white border border-white/[0.08] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Visit Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}

              {sanitizeUrl(entry.social_url) && (
                <a
                  href={sanitizeUrl(entry.social_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white border border-white/[0.08] transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Social / Community</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* CTA Actions */}
          <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setBidModalOpen(true)}
              className="flex-1 py-3.5 rounded-xl gold-gradient-button text-black font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/15"
            >
              <Zap className="w-4 h-4" />
              <span>OUTBID & CLAIM HIGHER SPOT</span>
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              className="py-3.5 px-6 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#E5C158]" />
              <span>SHARE RANK CARD</span>
            </button>
          </div>
        </div>

        {/* Public Bid History */}
        <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-[#E5C158]" />
              <h3 className="text-lg font-bold text-white">Public Bid History</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {bids.length} verified bids
            </span>
          </div>

          {bids.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No previous bid history recorded for this entry.
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="bg-[#141720] border border-white/[0.05] rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white">
                        {bid.visibility === 'anonymous' ? 'Anonymous Bidder' : bid.bidder_name || 'Verified Participant'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatTimeAgo(bid.verified_at || bid.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-[#E5C158] font-mono">
                      {formatINR(bid.amount)}
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BidModal
        entry={entry}
        isOpen={bidModalOpen}
        onClose={() => setBidModalOpen(false)}
      />

      <ShareModal
        entry={entry}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  );
}
