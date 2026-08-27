'use client';

import React, { useState, useRef } from 'react';
import { X, Copy, Check, Share2, Trophy, MessageCircle } from 'lucide-react';
import { Entry } from '@/types';
import { formatINR } from '@/lib/ranking';

interface ShareModalProps {
  entry: Entry;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ entry, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${entry.slug}`
    : `https://lelamrank.in/${entry.slug}`;

  const shareText = `🔥 ${entry.name} is currently ranked #${entry.current_rank || 1} on LELAM RANK with a verified bid of ${formatINR(entry.current_bid)}! Can you beat our rank? Check out the leaderboard: ${shareUrl}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F1117] border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Share Asset</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Share Your Verified Rank
          </h3>
          <p className="text-xs text-slate-400">
            Showcase your position to founders, investors, and competitors
          </p>
        </div>

        {/* Visual Share Card Asset */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181B26] via-[#10121A] to-[#0A0C10] border-2 border-amber-500/40 p-6 text-center shadow-xl shadow-amber-500/10 mb-6"
        >
          {/* Subtle gold corner accents */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-[#E5C158]" />
              </div>
              <span className="text-xs font-bold tracking-wider text-white">
                LELAM<span className="text-[#E5C158]">RANK</span>
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              KERALA TECH
            </span>
          </div>

          <div className="py-3">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#E5C158] text-sm font-extrabold tracking-wider mb-2">
              🏆 #{entry.current_rank || 1} IN KERALA
            </div>

            <h4 className="text-2xl font-black text-white tracking-tight mt-1 mb-1">
              {entry.name}
            </h4>

            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 my-2">
              {formatINR(entry.current_bid)}
            </div>

            <div className="text-xs font-extrabold tracking-widest text-amber-300 uppercase mt-3">
              CAN YOU BEAT ME?
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-slate-400">
            <span>lelamrank.in/{entry.slug}</span>
            <span className="font-mono text-amber-400/90 font-semibold">BID. RANK. RISE.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#141720] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleWhatsApp}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleTwitter}
              className="py-2.5 px-4 rounded-xl bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Share on X</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
