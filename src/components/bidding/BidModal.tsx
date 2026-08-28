'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Trophy,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Share2,
  Lock,
  Globe,
  ImageIcon,
  Share2 as SocialIcon,
  ExternalLink,
  Edit3,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Entry, UserProfile } from '@/types';
import { formatINR, calculateEstimatedRank } from '@/lib/ranking';
import { dbService } from '@/services/db';
import { authService } from '@/services/auth';
import { loadRazorpayScript, launchRazorpayCheckout } from '@/lib/razorpay';
import ShareModal from '@/components/share/ShareModal';
import AuthModal from '@/components/auth/AuthModal';

interface BidModalProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBidAmount: number, newRank: number) => void;
}

export default function BidModal({ entry, isOpen, onClose, onSuccess }: BidModalProps) {
  const [step, setStep] = useState<'details' | 'confirm' | 'paying' | 'success'>('details');

  // Step 1: Entity Details
  const [entityName, setEntityName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Step 1: Bid & Identity
  const [amountStr, setAmountStr] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'anonymous'>('public');
  const [bidderName, setBidderName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // UI / Feedback State
  const [error, setError] = useState<string | null>(null);
  const [estimatedRank, setEstimatedRank] = useState<number>(1);
  const [resultRank, setResultRank] = useState<number>(1);
  const [createdEntry, setCreatedEntry] = useState<Entry | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const currentHoldingBid = entry ? entry.current_bid : 50;
  const minimumRequired = entry ? currentHoldingBid + 1 : 50;

  const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const isValidBid = numericAmount >= minimumRequired;

  const loadUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setBidderName(user.username ? `@${user.username}` : user.full_name || '');
      setBidderEmail(user.email || '');
    }
  };

  useEffect(() => {
    if (isOpen && entry) {
      setStep('details');
      setEntityName('');
      setSlug('');
      setDescription('');
      setWebsiteUrl('');
      setLogoUrl('');
      setSocialUrl('');
      setSlugManuallyEdited(false);
      setAmountStr((entry.current_bid + 50).toString());
      setError(null);
      setCreatedEntry(null);
      loadUser();
      loadRazorpayScript().catch(console.error);
    }
  }, [isOpen, entry]);

  useEffect(() => {
    const unsub = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        setBidderName(user.username ? `@${user.username}` : user.full_name || '');
        setBidderEmail(user.email || '');
      }
    });
    return () => unsub();
  }, []);

  // Real-time Estimated Rank Calculation
  useEffect(() => {
    async function updateEstimatedRank() {
      if (isValidBid) {
        const entries = await dbService.getLeaderboardEntries();
        const est = calculateEstimatedRank(numericAmount, entries);
        setEstimatedRank(est);
      }
    }
    updateEstimatedRank();
  }, [numericAmount, isValidBid]);

  const handleNameChange = (val: string) => {
    setEntityName(val);
    if (!slugManuallyEdited) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(autoSlug);
    }
  };

  if (!isOpen || !entry) return null;

  const isRegistered = authService.isRegisteredUser(currentUser);

  // Step 1 -> Step 2: Validate Details and Bid
  const handleProceedToConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Enforce Authentication Gate (Must be registered founder, not guest)
    const user = await authService.getCurrentUser();
    if (!user || !authService.isRegisteredUser(user)) {
      setError('Create an account to continue. A registered founder account is required to take this spot.');
      setAuthModalOpen(true);
      return;
    }

    // 2. Validate Entity Fields
    if (!entityName.trim()) {
      setError('Please enter your business, startup, or product name.');
      return;
    }

    if (!slug.trim()) {
      setError('Please choose a valid leaderboard URL slug.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a one-line description of what you are building.');
      return;
    }

    if (description.trim().length > 180) {
      setError('Description must be 180 characters or fewer.');
      return;
    }

    // Check slug availability (unless it belongs to self)
    const existing = await dbService.getEntryBySlug(slug.trim().toLowerCase());
    if (existing && existing.id !== entry.id) {
      setError(`The URL slug "/${slug.trim()}" is already taken by another entity. Please choose a different slug.`);
      return;
    }

    // 3. Validate Bid Amount
    if (!isValidBid) {
      setError(`Minimum required bid is ${formatINR(minimumRequired)} (must exceed current bid ${formatINR(currentHoldingBid)}).`);
      return;
    }

    setStep('confirm');
  };

  // Step 2 -> Launch Razorpay Payment
  const handlePay = async () => {
    setStep('paying');
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      if (!user || !authService.isRegisteredUser(user)) {
        setStep('details');
        setError('Create an account to continue. Registered account required to place bids.');
        setAuthModalOpen(true);
        return;
      }

      // 1. Get token and create server-side order with verified user context
      setStep('paying');
      const token = await authService.getAccessToken();
      if (!token) {
        setStep('details');
        setError('Authentication required. Please sign in to place a bid.');
        setAuthModalOpen(true);
        return;
      }

      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const orderRes = await fetch('/api/bids/create-order', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          amount: numericAmount,
          entryId: 'new_entry',
          entryName: entityName.trim(),
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order.');
      }

      // 2. Ensure Razorpay Checkout SDK is loaded
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error('Razorpay Checkout SDK could not be loaded. Please check your network connection.');
      }

      // 3. Launch official Razorpay Checkout modal
      launchRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
        name: 'LELAM RANK',
        description: `Take Spot: ${entityName.trim()}`,
        prefill: {
          name: bidderName || user.full_name || entityName.trim(),
          email: user.email || bidderEmail,
        },
        onSuccess: async (rzpResp) => {
          await verifyAndCompleteBid({
            razorpay_order_id: rzpResp.razorpay_order_id,
            razorpay_payment_id: rzpResp.razorpay_payment_id,
            razorpay_signature: rzpResp.razorpay_signature,
            userId: user.id,
          });
        },
        onDismiss: () => {
          setStep('confirm');
          setError('Payment was cancelled. Your bid was not placed.');
        },
      });
    } catch (err: unknown) {
      setStep('confirm');
      const message = err instanceof Error ? err.message : 'Payment could not be processed.';
      setError(message);
    }
  };

  // Server-side verification and activation
  const verifyAndCompleteBid = async (paymentProof: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    userId: string;
  }) => {
    try {
      const token = await authService.getAccessToken();
      const verifyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        verifyHeaders['Authorization'] = `Bearer ${token}`;
      }

      const verifyRes = await fetch('/api/bids/verify', {
        method: 'POST',
        headers: verifyHeaders,
        body: JSON.stringify({
          ...paymentProof,
          entryId: 'new_entry',
          amount: numericAmount,
          entryData: {
            name: entityName.trim(),
            slug: slug.trim().toLowerCase(),
            description: description.trim(),
            website_url: websiteUrl.trim() || undefined,
            logo_url: logoUrl.trim() || undefined,
            social_url: socialUrl.trim() || undefined,
          },
          bidderId: paymentProof.userId,
          bidderName: bidderName.trim() || entityName.trim(),
          bidderEmail: currentUser?.email || bidderEmail,
          visibility,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      // Success! Update UI
      const newRank = verifyData.rank || 1;
      setResultRank(newRank);
      setCreatedEntry(verifyData.entry || {
        id: `entry-${Date.now()}`,
        name: entityName.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        current_bid: numericAmount,
        current_rank: newRank,
        status: 'active',
        featured: false,
        owner_id: paymentProof.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setStep('success');

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#E5C158', '#D4AF37', '#FFFFFF', '#FFA500'],
        });
      } catch {
        // Safe fallback
      }

      onSuccess?.(numericAmount, newRank);
    } catch (err: unknown) {
      setStep('confirm');
      const message = err instanceof Error ? err.message : 'Verification failed.';
      setError(message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
        <div className="relative w-full max-w-xl bg-[#0F1117] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Auth Notice if guest or not logged in */}
          {!isRegistered && step === 'details' && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#E5C158] shrink-0" />
                <span className="text-xs text-slate-200">
                  <strong>Create an account to continue:</strong> A registered founder account is required to take this spot.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl gold-gradient-button text-black font-bold text-xs shrink-0 cursor-pointer"
              >
                Register / Sign In
              </button>
            </div>
          )}

          {/* STEP 1: ENTITY DETAILS + BID FORM */}
          {step === 'details' && (
            <div>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Challenging Rank #{entry.current_rank || 'N/A'}</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Take This Spot
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Enter the business, startup, SaaS product, AI venture, or digital product you want to place on the leaderboard.
                </p>
              </div>

              {/* Challenged Spot Summary Box */}
              <div className="mb-6 p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#E5C158] font-bold text-sm shrink-0">
                    #{entry.current_rank || 'N/A'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Currently Holding Spot</div>
                    <div className="text-sm font-bold text-white truncate">{entry.name}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Bid</div>
                  <div className="text-sm font-black text-amber-400 font-mono">{formatINR(currentHoldingBid)}</div>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleProceedToConfirm} className="space-y-4">
                {/* 1. Entity Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Business / Startup / Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={entityName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Rave.work, Kochi AI, Wayanad Coffee Co"
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* 2. URL Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Leaderboard URL Slug *
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(typeof window !== 'undefined' && window.location.host && !window.location.host.includes('localhost')
                        ? window.location.host
                        : 'lelam-rank.vercel.app')}/{slug || 'my-startup'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-mono">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      }}
                      placeholder="my-startup"
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>
                </div>

                {/* 3. Description (<= 180 chars) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      One-Line Description / Value Proposition *
                    </label>
                    <span className={`text-[10px] ${
                      description.length > 180 ? 'text-rose-400 font-bold' : 'text-slate-500'
                    }`}>
                      {description.length}/180
                    </span>
                  </div>
                  <textarea
                    required
                    rows={2}
                    maxLength={180}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell Kerala in one sentence what you are building or selling..."
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                {/* 4. Optional Links Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Website URL</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourstartup.com"
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Logo / Avatar URL</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <SocialIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Social / Founder Link</span>
                    <span className="text-[10px] text-slate-500 font-normal">(X, LinkedIn, Instagram)</span>
                  </label>
                  <input
                    type="url"
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    placeholder="https://x.com/username or https://linkedin.com/in/..."
                    className="w-full bg-[#141720] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* 5. Bid Amount Input */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-white">
                      Your Verified Bid (₹ INR) *
                    </label>
                    <span className="text-[11px] text-amber-400/90 font-mono">
                      Min required: {formatINR(minimumRequired)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-3 text-lg font-bold text-[#E5C158]">
                      ₹
                    </span>
                    <input
                      type="text"
                      required
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder={minimumRequired.toString()}
                      className="w-full bg-[#141720] border border-white/[0.1] rounded-xl pl-9 pr-4 py-3 text-lg font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>

                  {/* Bid Validation Status */}
                  <div className="mt-2">
                    {numericAmount === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        Enter an amount strictly greater than {formatINR(currentHoldingBid)}.
                      </p>
                    ) : !isValidBid ? (
                      <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Minimum required: {formatINR(minimumRequired)}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Valid bid • Estimated Rank: #{estimatedRank}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 6. Bidder Identity Visibility */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Bidder Identity Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        visibility === 'public'
                          ? 'bg-amber-500/10 border-amber-500/50 text-[#E5C158]'
                          : 'bg-[#141720] border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>Public</div>
                      <div className="text-[10px] text-slate-400 font-normal">Show name on bid</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility('anonymous')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        visibility === 'anonymous'
                          ? 'bg-amber-500/10 border-amber-500/50 text-[#E5C158]'
                          : 'bg-[#141720] border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>Anonymous</div>
                      <div className="text-[10px] text-slate-400 font-normal">Hide bidder name</div>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isValidBid || !isRegistered}
                  className="w-full py-3.5 rounded-xl gold-gradient-button text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 mt-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <span>Review Bid & Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: REVIEW / CONFIRMATION SCREEN */}
          {step === 'confirm' && (
            <div>
              {/* Header */}
              <div className="text-center mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5C158] bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Step 2 of 2 — Review & Confirm
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  CONFIRM YOUR BID
                </h3>
                <p className="text-xs text-slate-400">
                  Review details before proceeding to Razorpay payment
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Review Summary Card */}
              <div className="bg-[#141720] border border-white/[0.08] rounded-2xl p-5 space-y-4 mb-6">
                {/* Challenged Spot */}
                <div className="flex justify-between items-center text-xs pb-3 border-b border-white/[0.06]">
                  <span className="text-slate-400">Challenging Spot</span>
                  <div className="text-right">
                    <span className="font-bold text-white">{entry.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">(Rank #{entry.current_rank || 'N/A'})</span>
                  </div>
                </div>

                {/* New Entity Name & Slug */}
                <div className="flex justify-between items-start text-xs pb-3 border-b border-white/[0.06]">
                  <span className="text-slate-400">Your New Entity</span>
                  <div className="text-right">
                    <div className="font-bold text-white">{entityName}</div>
                    <div className="text-[11px] text-amber-400 font-mono">{(typeof window !== 'undefined' && window.location.host && !window.location.host.includes('localhost') ? window.location.host : 'lelam-rank.vercel.app')}/{slug}</div>
                  </div>
                </div>

                {/* Description */}
                <div className="text-xs pb-3 border-b border-white/[0.06]">
                  <span className="text-slate-400 block mb-1">One-Line Pitch</span>
                  <p className="text-slate-200 italic font-normal">{description}</p>
                </div>

                {/* Current vs New Bid */}
                <div className="flex justify-between items-center text-xs pb-3 border-b border-white/[0.06]">
                  <span className="text-slate-400">Current Holding Bid</span>
                  <span className="text-slate-400 font-mono">{formatINR(currentHoldingBid)}</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-white/[0.06]">
                  <span className="text-white font-bold">Your New Bid</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {formatINR(numericAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-white/[0.06]">
                  <span className="text-slate-400">Estimated New Rank</span>
                  <span className="font-bold text-[#E5C158]">#{estimatedRank}</span>
                </div>

                {/* Bidder Visibility */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Bidder Identity</span>
                  <span className="font-semibold text-slate-300">
                    {visibility === 'anonymous' ? 'Anonymous' : bidderName || 'Public'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handlePay}
                  className="w-full py-4 rounded-xl gold-gradient-button text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proceed to Payment ({formatINR(numericAmount)})</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Bid</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: PAYING (Loading state) */}
          {step === 'paying' && (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] animate-pulse">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Opening Razorpay Checkout...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Complete your test payment in the secure Razorpay modal to place your bid on the live leaderboard.
              </p>
            </div>
          )}

          {/* STEP: SUCCESS SCREEN */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  SPOT SUCCESSFULLY CLAIMED!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your entity is now LIVE on the Kerala leaderboard at Rank #{resultRank}
                </p>
              </div>

              {/* Success Result Card */}
              <div className="bg-[#141720] border border-emerald-500/30 rounded-2xl p-5 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Entity</span>
                  <span className="text-sm font-bold text-white">{entityName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Live URL</span>
                  <Link
                    href={`/${slug}`}
                    className="text-xs text-amber-400 hover:underline font-mono"
                  >
                    {(typeof window !== 'undefined' && window.location.host && !window.location.host.includes('localhost') ? window.location.host : 'lelam-rank.vercel.app')}/{slug}
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">New Rank</span>
                  <span className="text-sm font-black text-[#E5C158]">#{resultRank}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Holding Bid</span>
                  <span className="text-sm font-mono font-bold text-white">{formatINR(numericAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Link
                  href={`/${slug}`}
                  className="w-full py-3.5 rounded-xl gold-gradient-button text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <span>View Live Startup Profile</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/[0.08]"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Share Rank</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal on Success */}
      {createdEntry && (
        <ShareModal
          entry={createdEntry}
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
    </>
  );
}
