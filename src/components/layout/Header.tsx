'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Menu, X, ArrowUpRight, ShieldCheck, User } from 'lucide-react';
import { authService } from '@/services/auth';
import { UserProfile } from '@/types';
import AuthModal from '@/components/auth/AuthModal';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
    const unsub = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    return () => {
      unsub();
    };
  }, []);

  const navLinks = [
    { name: 'Leaderboard', href: '/' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'About', href: '/about' },
    { name: 'Rules', href: '/rules' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass-nav border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Wordmark */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 p-[1px] shadow-lg shadow-amber-500/10">
                <div className="w-full h-full bg-[#08090C] rounded-[11px] flex items-center justify-center group-hover:bg-[#0c0e14] transition-colors">
                  <Trophy className="w-5 h-5 text-[#E5C158]" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                    LELAM<span className="text-[#E5C158]">RANK</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-[#E5C158] border border-amber-500/20 font-medium tracking-wider uppercase">
                    ലേലം
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 tracking-wider font-mono">
                  BID. RANK. RISE.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#E5C158] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/create"
                className="gold-gradient-button text-black font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/10"
              >
                <span>Claim Your Spot</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-3">
              <Link
                href="/create"
                className="gold-gradient-button text-black font-bold text-xs px-3 py-2 rounded-lg"
              >
                Claim
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0c12] border-b border-white/[0.1] px-4 pt-3 pb-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/[0.05] hover:text-[#E5C158]"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/[0.05] flex items-center gap-2"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Dashboard</span>
              </Link>
              <Link
                href="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="gold-gradient-button text-black font-bold text-center py-2.5 rounded-lg text-sm"
              >
                Claim Your Spot (₹50 Min)
              </Link>
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
