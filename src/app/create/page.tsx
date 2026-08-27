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
import { loadRazorpayScript, launchRazorpayCheckout } from '@/lib/razorpay';
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
  const [estimatedRank, setEstimatedRank] = useState<number>(1);
  const [createdEntry, setCreatedEntry] = useState<Entry | null>(null);
  const [createdRank, setCreatedRank] = useState<number>(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Real Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    loadUser();
    loadRazorpayScript().catch(console.error);
  }, []);

  const loadUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const verified = await authService.isEmailVerified();
      setIsEmailVerified(verified);
      if (!bidderName && user.full_name) {
        setBidderName(user.full_name);
      }
    }
  };

  const initialBidNum = parseFloat(initialBidStr) || 0;
  const isValidBid = initialBidNum >= 50;

  useEffect(() => {
    async function updateEstimatedRank() {
      if (isValidBid) {
        const entries = await dbService.getLeaderboardEntries();
        const est = calculateEstimatedRank(initialBidNum, entries);
        setEstimatedRank(est);
      }
    }
    updateEstimatedRank();
  }, [initialBidNum, isValidBid]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialSlugParam) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(autoSlug);
    }
  };

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

    if (!name.trim()) {
      setError('Please enter a name for your startup / product.');
      return;
    }

    if (!slug.trim()) {
      setError('Please choose a valid URL slug.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a short pitch or description.');
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
      // 1. Strict Auth Gate
      const user = await authService.getCurrentUser();
      if (!user) {
        setStep('details');
        setError('You must be signed in to create an entry.');
        setAuthModalOpen(true);
        return;
      }

      // 2. Strict Email Verification Gate
      const verified = await authService.isEmailVerified();
      if (!verified) {
        setStep('details');
        setError('Please verify your email address before creating an entry.');
        return;
      }

      // 3. Ensure Razorpay Checkout SDK is loaded
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error('Razorpay Checkout SDK could not be loaded. Please check your network connection.');
      }

      // 4. Create Order on Server
      const orderRes = await fetch('/api/bids/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: initialBidNum,
          entryId: 'new_entry',
          entryName: name.trim(),
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create Razorpay payment order.');
      }

      // 5. Launch Razorpay Checkout Modal
      launchRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
        name: 'LELAM RANK',
        description: `Initial verified bid for ${name.trim()}`,
        prefill: {
          name: bidderName || user.full_name || name.trim(),
          email: user.email,
        },
        onSuccess: async (rzpResp) => {
          try {
            // 6. Verify Payment Signature and Create Entry on Server
            const verifyRes = await fetch('/api/bids/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResp.razorpay_order_id,
                razorpay_payment_id: rzpResp.razorpay_payment_id,
                razorpay_signature: rzpResp.razorpay_signature,
                entryId: 'new_entry',
                amount: initialBidNum,
                entryData: {
                  name: name.trim(),
                  slug: slug.trim().toLowerCase(),
                  description: description.trim(),
                  logo_url: logoUrl.trim() || undefined,
                  website_url: websiteUrl.trim() || undefined,
                  social_url: socialUrl.trim() || undefined,
                  bidder_name: bidderName || name.trim(),
                  visibility,
                },
                bidderEmail: user.email,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            setCreatedEntry(verifyData.entry);
            setCreatedRank(verifyData.rank || 1);
            setStep('success');

            try {
              confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#E5C158', '#FFFFFF', '#FFA000'],
              });
            } catch {}
          } catch (verifyErr: unknown) {
            setStep('confirm');
            const message = verifyErr instanceof Error ? verifyErr.message : 'Payment verification failed.';
            setError(message);
          }
        },
        onDismiss: () => {
          setStep('confirm');
          setError('Payment was cancelled. Your spot was not created.');
        },
      });
    } catch (err: unknown) {
      setStep('confirm');
      const message = err instanceof Error ? err.message : 'Could not initialize payment checkout.';
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
                  Leaderboard URL Slug *
                </label>
                <div className="flex items-center rounded-xl bg-[#141720] border border-white/[0.1] px-4 py-3 text-sm text-slate-400 focus-within:border-amber-500/50">
                  <span className="shrink-0 text-slate-500">lelamrank.in/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                      )
                    }
                    placeholder="my-startup"
                    className="w-full bg-transparent border-0 text-white placeholder:text-slate-600 focus:outline-none ml-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  One-Line Description / Value Proposition *
                </label>
                <textarea
                  required
                  rows={2}
                  maxLength={180}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell Kerala in one sentence what you are building or selling..."
                  className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                />
                <div className="text-right text-[10px] text-slate-500 mt-1">
                  {description.length}/180
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5C158] pb-2 border-b border-white/[0.06]">
                Online Presence (Optional)
              </h3>

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
                      placeholder="https://yourcompany.com"
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

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
                      placeholder="https://.../logo.png"
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Social / Founder Link (X, LinkedIn, Instagram)
                </label>
                <input
                  type="url"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  placeholder="https://x.com/yourhandle"
                  className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5C158] pb-2 border-b border-white/[0.06]">
                Initial Verified Bid
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Initial Bid Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-lg font-bold text-[#E5C158]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="50"
                    step="1"
                    required
                    value={initialBidStr}
                    onChange={(e) => setInitialBidStr(e.target.value)}
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-xl font-mono font-bold text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span>Minimum entry bid: ₹50</span>
                  {isValidBid && (
                    <span className="text-[#E5C158] font-bold">
                      Estimated Live Rank: #{estimatedRank}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Bidder Display Name
                  </label>
                  <input
                    type="text"
                    value={bidderName}
                    onChange={(e) => setBidderName(e.target.value)}
                    placeholder={currentUser?.full_name || 'Founder name or Company name'}
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Bidder Identity Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'public' | 'anonymous')}
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="public">Public (Show my name on the bid)</option>
                    <option value="anonymous">Anonymous (Hide name on bid record)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValidBid || !currentUser || !isEmailVerified}
              className="w-full py-4 rounded-xl gold-gradient-button text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Review Details & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Confirm Details & Pay */}
        {step === 'confirm' && (
          <div className="rounded-3xl bg-[#0E1017] border border-white/[0.08] p-6 sm:p-10 space-y-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Review Your Spot Entry</h2>

            <div className="rounded-2xl bg-[#141720] border border-white/[0.06] p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                <span className="text-xs text-slate-400">Public Name</span>
                <span className="text-sm font-bold text-white">{name}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                <span className="text-xs text-slate-400">URL Slug</span>
                <span className="text-sm font-mono text-amber-400">lelamrank.in/{slug}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                <span className="text-xs text-slate-400">Description</span>
                <span className="text-xs text-slate-300 max-w-xs text-right line-clamp-2">{description}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                <span className="text-xs text-slate-400">Estimated Rank</span>
                <span className="text-sm font-black text-[#E5C158]">#{estimatedRank}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-slate-300">Total Verified Bid</span>
                <span className="text-2xl font-black font-mono text-[#E5C158]">{formatINR(initialBidNum)}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#E5C158] shrink-0 mt-0.5" />
              <span>
                Your payment will be securely processed via Razorpay. Upon verified payment confirmation, your entry will immediately be published on the live leaderboard.
              </span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex-1 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handlePayAndCreate}
                className="flex-2 py-3.5 rounded-xl gold-gradient-button text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <span>Pay {formatINR(initialBidNum)} & Launch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Paying / Processing */}
        {step === 'paying' && (
          <div className="rounded-3xl bg-[#0E1017] border border-white/[0.08] p-12 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">Opening Razorpay Checkout...</h3>
            <p className="text-xs text-slate-400">
              Please complete the payment in the Razorpay window to verify and publish your entry.
            </p>
          </div>
        )}

        {/* Step 4: Success Screen */}
        {step === 'success' && createdEntry && (
          <div className="rounded-3xl bg-gradient-to-b from-[#141824] to-[#0A0C11] border-2 border-amber-500/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-[#E5C158] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SPOT SUCCESSFULLY CLAIMED & VERIFIED!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {createdEntry.name} is now Live!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                You claimed rank <strong className="text-[#E5C158]">#{createdRank}</strong> with a verified holding bid of {formatINR(createdEntry.current_bid)}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href={`/${createdEntry.slug}`}
                className="px-6 py-3 rounded-xl gold-gradient-button text-black font-black text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <span>View Public Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShareModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share Branded Rank Card</span>
              </button>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {createdEntry && (
          <ShareModal
            entry={{ ...createdEntry, current_rank: createdRank }}
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
          />
        )}

        {/* Auth Modal Gate */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            loadUser();
          }}
        />
      </div>
    </>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading...</div>}>
      <CreateEntryContent />
    </Suspense>
  );
}
