'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  ArrowRight,
  ShieldCheck,
  Globe,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService } from '@/services/db';
import { authService } from '@/services/auth';
import { calculateEstimatedRank, formatINR } from '@/lib/ranking';
import ShareModal from '@/components/share/ShareModal';
import AuthModal from '@/components/auth/AuthModal';
import { Entry, UserProfile } from '@/types';

function CreateEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSlugParam = searchParams.get('slug') || '';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState(initialSlugParam);
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [initialBidStr, setInitialBidStr] = useState('500');
  const [bidderName, setBidderName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'anonymous'>('public');

  const [step, setStep] = useState<'details' | 'confirm' | 'paying' | 'success'>('details');
  const [error, setError] = useState<string | null>(null);
  const [createdEntry, setCreatedEntry] = useState<Entry | null>(null);
  const [createdRank, setCreatedRank] = useState<number>(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);

  const loadUserData = async () => {
    const list = await dbService.getLeaderboardEntries();
    setAllEntries(list);
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setBidderName(user.full_name || '');
      const verified = await authService.isEmailVerified();
      setIsEmailVerified(verified);
    } else {
      setIsEmailVerified(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialSlugParam) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const initialBidNum = parseInt(initialBidStr.replace(/[^0-9]/g, ''), 10) || 0;
  const isValidBid = initialBidNum >= 50;
  const estimatedRank = calculateEstimatedRank(initialBidNum, allEntries);

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Enforce Authentication Gate
    const user = await authService.getCurrentUser();
    if (!user) {
      setError('You must sign in or register before creating an entry.');
      setAuthModalOpen(true);
      return;
    }

    // 2. Enforce Email Verification Gate
    const verified = await authService.isEmailVerified();
    if (!verified) {
      setError('Please verify your email address before creating an entry. Check your inbox for the confirmation link.');
      return;
    }

    if (!name.trim() || !description.trim()) {
      setError('Please provide a name and short description.');
      return;
    }

    if (!slug.trim()) {
      setError('Please provide a URL slug.');
      return;
    }

    const existing = await dbService.getEntryBySlug(slug.trim());
    if (existing) {
      setError(`The slug "/${slug}" is already claimed. Please pick another.`);
      return;
    }

    if (!isValidBid) {
      setError('Minimum bid is ₹50.');
      return;
    }

    setStep('confirm');
  };

  const handlePayAndCreate = async () => {
    setStep('paying');
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setStep('details');
        setError('You must be signed in to create an entry.');
        setAuthModalOpen(true);
        return;
      }

      const verified = await authService.isEmailVerified();
      if (!verified) {
        setStep('details');
        setError('Please verify your email address before creating an entry.');
        return;
      }

      const result = await dbService.createEntry({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        logo_url: logoUrl.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        social_url: socialUrl.trim() || undefined,
        initial_bid: initialBidNum,
        owner_id: user.id, // Strictly authentic user ID only
        bidder_name: bidderName || name,
        visibility,
      });

      setCreatedEntry(result.entry);
      setCreatedRank(result.rank);
      setStep('success');

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#E5C158', '#FFFFFF', '#FFA000'],
        });
      } catch {}
    } catch (err: unknown) {
      setStep('details');
      const message = err instanceof Error ? err.message : 'Could not create entry.';
      setError(message);
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>ENTRY REGISTRATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Claim Your Spot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Place your initial verified bid and enter the live Kerala leaderboard.
          </p>
        </div>

        {/* Auth Notice if not logged in */}
        {!currentUser && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#E5C158] shrink-0" />
              <div className="text-xs text-slate-200">
                <strong>Authentication Required:</strong> You need a verified founder account to claim a spot.
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl gold-gradient-button text-black font-bold text-xs shrink-0 cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Verification Notice if logged in but unverified */}
        {currentUser && !isEmailVerified && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong>Email Verification Pending:</strong> Please check your email (<strong>{currentUser.email}</strong>) and confirm your address before creating an entry.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Details & Bid Input */}
        {step === 'details' && (
          <form onSubmit={handleSubmitDetails} className="rounded-3xl bg-[#0E1017] border border-white/[0.08] p-6 sm:p-10 space-y-6 shadow-2xl">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5C158] pb-2 border-b border-white/[0.06]">
                Entity Details (Required)
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Public Name / Brand / Startup *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Rave.work, Kochi AI, Wayanad Coffee Co"
                  className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Public URL Slug *
                </label>
                <div className="flex items-center bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-slate-400 focus-within:border-amber-500/50">
                  <span className="font-mono text-slate-400">lelamrank.in/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="my-startup"
                    className="flex-1 bg-transparent text-white font-mono font-semibold focus:outline-none pl-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  One-line Pitch / Short Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Asynchronous collaboration suite built for fast-moving distributed engineering teams in Kerala."
                  className="w-full bg-[#141720] border border-white/[0.1] rounded-xl p-4 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-white/[0.06]">
                Optional Links & Logo
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Logo / Avatar Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://yourdomain.com/logo.png"
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Leave empty to generate a clean branded initials badge automatically.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourdomain.com"
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Instagram / Social Link
                  </label>
                  <div className="relative">
                    <Share2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="url"
                      value={socialUrl}
                      onChange={(e) => setSocialUrl(e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5C158] pb-2 border-b border-white/[0.06]">
                Initial Verified Bid
              </h3>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Your Bid (₹) *
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono">
                    Minimum: ₹50 (No Maximum)
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xl font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={50}
                    step={1}
                    required
                    value={initialBidStr}
                    onChange={(e) => setInitialBidStr(e.target.value)}
                    placeholder="500"
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3.5 text-2xl font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  {isValidBid ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valid bid amount
                      </span>
                      <span className="bg-amber-500/10 border border-amber-500/20 text-[#E5C158] px-2.5 py-1 rounded-md font-bold">
                        Estimated Rank: #{estimatedRank}
                      </span>
                    </div>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Minimum required bid is ₹50
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValidBid}
              className="w-full py-4 rounded-xl gold-gradient-button text-black font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-500/10 disabled:opacity-40"
            >
              <span>Review Entry & Confirm Bid</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && (
          <div className="rounded-3xl bg-[#0E1017] border border-amber-500/30 p-6 sm:p-10 space-y-6 shadow-2xl">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5C158] bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Final Step
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">
                CONFIRM YOUR ENTRY & BID
              </h2>
              <p className="text-xs text-slate-400">
                Review your entry details before sandbox payment
              </p>
            </div>

            <div className="bg-[#141720] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-xs pb-2.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Entry Name</span>
                <span className="font-bold text-white">{name}</span>
              </div>
              <div className="flex justify-between text-xs pb-2.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Public Slug</span>
                <span className="font-mono text-amber-400">lelamrank.in/{slug}</span>
              </div>
              <div className="flex justify-between text-xs pb-2.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Description</span>
                <span className="text-slate-300 max-w-xs text-right truncate">{description}</span>
              </div>
              <div className="flex justify-between text-sm pb-2.5 border-b border-white/[0.06]">
                <span className="text-amber-400 font-semibold">Initial Bid</span>
                <span className="font-black text-white text-base">{formatINR(initialBidNum)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Estimated Starting Rank</span>
                <span className="font-extrabold text-[#E5C158] text-sm">#{estimatedRank}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Edit Details
              </button>
              <button
                onClick={handlePayAndCreate}
                className="flex-2 py-3 rounded-xl gold-gradient-button text-black font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Proceed to Payment</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Paying */}
        {step === 'paying' && (
          <div className="rounded-3xl bg-[#0E1017] border border-white/[0.08] p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-[#E5C158] animate-spin mx-auto"></div>
            <h3 className="text-lg font-bold text-white">Verifying Payment & Allocating Rank...</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Registering {name} onto the live authoritative leaderboard.
            </p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && createdEntry && (
          <div className="rounded-3xl bg-[#0E1017] border border-amber-500/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-[#E5C158]">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#E5C158] font-extrabold">
                SPOT SUCCESSFULLY CLAIMED!
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Rank #{createdRank} in Kerala
              </h2>
              <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
                <strong className="text-white">{createdEntry.name}</strong> is live at{' '}
                <strong className="text-amber-400 font-mono">/{createdEntry.slug}</strong> with a verified bid of {formatINR(createdEntry.current_bid)}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex-1 py-3.5 rounded-xl gold-gradient-button text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Rank Card</span>
              </button>

              <Link
                href={`/${createdEntry.slug}`}
                className="py-3.5 px-6 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                <span>View Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {createdEntry && shareModalOpen && (
        <ShareModal
          entry={createdEntry}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            router.push(`/${createdEntry.slug}`);
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          loadUserData();
        }}
        onSuccess={() => {
          loadUserData();
        }}
      />
    </>
  );
}

export default function CreateEntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-[#E5C158] animate-spin"></div>
      </div>
    }>
      <CreateEntryContent />
    </Suspense>
  );
}
