'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  ArrowUpRight,
  Zap,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { dbService } from '@/services/db';
import { authService } from '@/services/auth';
import { Entry, UserProfile } from '@/types';
import { formatINR } from '@/lib/ranking';
import BidModal from '@/components/bidding/BidModal';
import ShareModal from '@/components/share/ShareModal';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [myEntries, setMyEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const loadData = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    const all = await dbService.getLeaderboardEntries();
    if (user) {
      const userEntries = all.filter(
        (e) => e.owner_id === user.id || e.owner_id.startsWith('user-')
      );
      setMyEntries(userEntries);
    } else {
      setMyEntries([]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('lelam_store_updated', loadData);
    return () => window.removeEventListener('lelam_store_updated', loadData);
  }, []);

  const handleBidAgain = (entry: Entry) => {
    setSelectedEntry(entry);
    setBidModalOpen(true);
  };

  const handleShare = (entry: Entry) => {
    setSelectedEntry(entry);
    setShareModalOpen(true);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FOUNDER PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              My Leaderboard Entries
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track your live rankings and outbid contenders in real time
            </p>
          </div>

          <Link
            href="/create"
            className="gold-gradient-button text-black font-extrabold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Another Entry</span>
          </Link>
        </div>

        {/* Entries Grid / List */}
        {myEntries.length === 0 ? (
          <div className="rounded-3xl bg-[#0E1017] border border-dashed border-white/[0.15] p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Entries Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              You have not registered an entry on the leaderboard yet.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl bg-[#0E1017] border border-white/[0.08] hover:border-amber-500/30 p-6 space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
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
                        <span className="font-bold text-white">
                          {entry.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {entry.name}
                      </h3>
                      <Link
                        href={`/${entry.slug}`}
                        className="text-xs text-amber-400 hover:underline font-mono"
                      >
                        lelamrank.in/{entry.slug}
                      </Link>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[#E5C158]">
                    RANK #{entry.current_rank || 'N/A'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">
                  {entry.description}
                </p>

                <div className="bg-black/40 border border-white/[0.05] rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Current Holding Bid</span>
                  <span className="text-base font-black text-white font-mono">
                    {formatINR(entry.current_bid)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleBidAgain(entry)}
                    className="flex-1 py-2.5 rounded-lg gold-gradient-button text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Bid Again</span>
                  </button>

                  <button
                    onClick={() => handleShare(entry)}
                    className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] transition-colors cursor-pointer"
                    title="Share Rank Card"
                  >
                    <Share2 className="w-4 h-4 text-[#E5C158]" />
                  </button>

                  <Link
                    href={`/${entry.slug}`}
                    className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] transition-colors"
                    title="View public page"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEntry && (
        <>
          <BidModal
            entry={selectedEntry}
            isOpen={bidModalOpen}
            onClose={() => {
              setBidModalOpen(false);
              setSelectedEntry(null);
            }}
          />

          <ShareModal
            entry={selectedEntry}
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false);
              setSelectedEntry(null);
            }}
          />
        </>
      )}
    </>
  );
}
