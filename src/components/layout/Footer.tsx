import React from 'react';
import Link from 'next/link';
import { Trophy, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#06070a] border-t border-white/[0.08] pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#141720] border border-amber-500/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#E5C158]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                LELAM<span className="text-[#E5C158]">RANK</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Where Kerala startups, SaaS founders, AI tools, and emerging businesses compete for visibility by placing bids. One global leaderboard. 100% deterministic ranking.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Deterministic Ranking Engine
              </span>
              <span>•</span>
              <span>Minimum Bid ₹50</span>
              <span>•</span>
              <span>No Cap</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/leaderboard" className="hover:text-white transition-colors">
                  Live Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-white transition-colors">
                  Claim Your Spot
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-white transition-colors">
                  Platform Rules & Moderation
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About LELAM RANK
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white text-slate-500 transition-colors text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} LELAM RANK. All rights reserved. “Bid. Rank. Rise.”
          </div>
          <div className="flex items-center gap-2">
            <span>Built for the Kerala & Global Startup Ecosystem</span>
            <span>•</span>
            <span className="text-amber-400/80">ലഭ്യമായ മികച്ച സ്ഥാനം സ്വന്തമാക്കൂ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
