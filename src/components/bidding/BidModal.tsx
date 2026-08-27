'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Share2, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Entry, UserProfile } from '@/types';
import { formatINR, calculateEstimatedRank } from '@/lib/ranking';
import { lelamStore } from '@/lib/store';
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
  const [step, setStep] = useState<'input' | 'confirm' | 'paying' | 'success'>('input');
  const [amountStr, setAmountStr] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'anonymous'>('public');
  const [bidderName, setBidderName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultRank, setResultRank] = useState<number>(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const currentBid = entry ? entry.current_bid : 50;
  const minimumRequired = entry ? currentBid + 1 : 50;

  const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const isValidBid = numericAmount >= minimumRequired;

  const allEntries = lelamStore.getEntries();
  const estimatedRank = calculateEstimatedRank(numericAmount, allEntries, entry?.id);

  const loadUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setBidderName(user.full_name || '');
      setBidderEmail(user.email || '');
      const verified = await authService.isEmailVerified();
      setIsEmailVerified(verified);
    } else {
      setIsEmailVerified(false);
    }
  };

  useEffect(() => {
    if (isOpen && entry) {
      setStep('input');
      setAmountStr('');
      setError(null);
      loadUser();
      loadRazorpayScript().catch(console.error);
    }
  }, [isOpen, entry]);

  if (!isOpen || !entry) return null;

  const handleProceedToConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Enforce Authentication Gate
    const user = await authService.getCurrentUser();
    if (!user) {
      setError('You must sign in or register before placing a bid.');
      setAuthModalOpen(true);
      return;
    }

    // 2. Enforce Email Verification Gate
    const verified = await authService.isEmailVerified();
    if (!verified) {
      setError('Please verify your email address before placing a bid. Check your inbox for the confirmation link.');
      return;
    }

    if (!isValidBid) {
      setError(`Minimum required bid is ${formatINR(minimumRequired)}`);
      return;
    }

    setStep('confirm');
  };

  const handlePay = async () => {
    setStep('paying');
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setStep('input');
        setError('You must be signed in to place a bid.');
        setAuthModalOpen(true);
        return;
      }

      const verified = await authService.isEmailVerified();
      if (!verified) {
        setStep('input');
        setError('Please verify your email address before placing a bid.');
        return;
      }

      // 1. Create server-side order with verified user context
      const orderRes = await fetch('/api/bids/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          entryId: entry.id,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order.');
      }

      // 2. Launch checkout if Razorpay SDK loaded and real key exists
      const isSandboxDummy = !orderData.keyId || orderData.keyId.includes('sandbox') || orderData.keyId.includes('dummy');

      if (!isSandboxDummy && typeof window !== 'undefined' && (window as unknown as { Razorpay: unknown }).Razorpay) {
        launchRazorpayCheckout({
          orderId: orderData.orderId,
          amount: orderData.amount,
          keyId: orderData.keyId,
          name: 'LELAM RANK',
          description: `Bid for ${entry.name}`,
          prefill: {
            name: bidderName || user.full_name || entry.name,
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
          },
        });
      } else {
        // Test sandbox automated verification
        setTimeout(async () => {
          await verifyAndCompleteBid({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_signature: 'sandbox_sig_valid',
            userId: user.id,
          });
        }, 1000);
      }
    } catch (err: unknown) {
      setStep('input');
      const message = err instanceof Error ? err.message : 'Payment could not be processed.';
      setError(message);
    }
  };

  const verifyAndCompleteBid = async (paymentProof: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    userId: string;
  }) => {
    try {
      const verifyRes = await fetch('/api/bids/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentProof,
          entryId: entry.id,
          amount: numericAmount,
          bidderId: paymentProof.userId,
          bidderName: bidderName || currentUser?.full_name || entry.name,
          bidderEmail: currentUser?.email || bidderEmail,
          visibility,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      setResultRank(verifyData.newRank || estimatedRank);
      setStep('success');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#E5C158', '#FFFFFF', '#FFA000'],
        });
      } catch {}

      onSuccess?.(numericAmount, verifyData.newRank || estimatedRank);
    } catch (err: unknown) {
      setStep('input');
      const message = err instanceof Error ? err.message : 'Verification failed.';
      setError(message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-lg bg-[#0E1017] border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-2xl shadow-amber-500/5">
          {/* Close button */}
          {step !== 'paying' && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Auth Notice if not logged in */}
          {!currentUser && step === 'input' && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#E5C158] shrink-0" />
                <span className="text-xs text-slate-200">
                  You must be signed in to place a verified bid.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-lg gold-gradient-button text-black font-bold text-[11px] shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Verification Notice if logged in but unverified */}
          {currentUser && !isEmailVerified && step === 'input' && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Please verify your email (<strong>{currentUser.email}</strong>) before placing a bid.
              </span>
            </div>
          )}

          {/* Step 1: Input */}
          {step === 'input' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#E5C158]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Bid on {entry.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Current Rank: #{entry.current_rank || 'N/A'} • Current Bid: {formatINR(entry.current_bid)}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleProceedToConfirm} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Your Bid Amount (₹)
                    </label>
                    <span className="text-[11px] text-amber-400/90 font-mono">
                      Min: {formatINR(minimumRequired)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-lg font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={minimumRequired}
                      step={1}
                      required
                      autoFocus
                      value={amountStr}
                      onChange={(e) => {
                        setAmountStr(e.target.value);
                        setError(null);
                      }}
                      placeholder={minimumRequired.toString()}
                      className="w-full bg-[#151822] border border-white/[0.1] rounded-xl pl-9 pr-4 py-3 text-xl font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    {numericAmount > 0 && !isValidBid && (
                      <span className="text-rose-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Minimum required: {formatINR(minimumRequired)}
                      </span>
                    )}
                    {isValidBid && (
                      <div className="flex items-center justify-between w-full text-emerald-400">
                        <span className="flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Valid bid
                        </span>
                        <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Estimated Rank: #{estimatedRank}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Bidder Identity Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        visibility === 'public'
                          ? 'bg-amber-500/10 border-amber-500 text-[#E5C158]'
                          : 'bg-[#151822] border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>Public</div>
                      <div className="text-[10px] text-slate-400 font-normal">Show on bid history</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('anonymous')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        visibility === 'anonymous'
                          ? 'bg-amber-500/10 border-amber-500 text-[#E5C158]'
                          : 'bg-[#151822] border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>Anonymous</div>
                      <div className="text-[10px] text-slate-400 font-normal">Hide bidder identity</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isValidBid}
                  className="w-full py-3 rounded-xl gold-gradient-button text-black font-bold text-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Review Bid</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 'confirm' && (
            <div>
              <div className="text-center mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5C158] bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Step 2 of 2
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  CONFIRM YOUR BID
                </h3>
                <p className="text-xs text-slate-400">
                  Review details before proceeding to Razorpay test payment
                </p>
              </div>

              <div className="bg-[#141720] border border-white/[0.08] rounded-xl p-4 space-y-3 mb-6">
                <div className="flex justify-between text-xs pb-2 border-b border-white/[0.06]">
                  <span className="text-slate-400">Entry</span>
                  <span className="font-semibold text-white">{entry.name}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-white/[0.06]">
                  <span className="text-slate-400">Current Rank</span>
                  <span className="font-semibold text-slate-300">#{entry.current_rank || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-white/[0.06]">
                  <span className="text-slate-400">Current Bid</span>
                  <span className="font-semibold text-slate-300">{formatINR(entry.current_bid)}</span>
                </div>
                <div className="flex justify-between text-sm pb-2 border-b border-white/[0.06]">
                  <span className="text-amber-400 font-semibold">Your New Bid</span>
                  <span className="font-bold text-white text-base">{formatINR(numericAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Estimated New Rank</span>
                  <span className="font-bold text-[#E5C158] text-sm">#{estimatedRank}</span>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 text-[11px] text-amber-200/80 mb-5 leading-relaxed">
                ℹ️ Bids are permanent payments. If another participant outbids you later, your entry remains active on the leaderboard at its deserved rank.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Edit Amount
                </button>
                <button
                  onClick={handlePay}
                  className="flex-2 py-3 rounded-xl gold-gradient-button text-black font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proceed to Payment</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Paying */}
          {step === 'paying' && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-[#E5C158] animate-spin mx-auto"></div>
              <h3 className="text-lg font-bold text-white">Processing Payment...</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Securely verifying order and updating the authoritative leaderboard.
              </p>
              <div className="text-[10px] text-amber-400/80 font-mono">
                RAZORPAY TEST MODE • SERVER VERIFICATION
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-[#E5C158]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#E5C158] font-bold">
                  Payment Verified
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  Rank #{resultRank} Achieved!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {entry.name} is now positioned at <strong className="text-white">#{resultRank}</strong> with a verified bid of <strong className="text-white">{formatINR(numericAmount)}</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="flex-1 py-3 rounded-xl gold-gradient-button text-black font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Your Rank Card</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  View Leaderboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {shareModalOpen && (
        <ShareModal
          entry={{ ...entry, current_rank: resultRank, current_bid: numericAmount }}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            onClose();
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          loadUser();
        }}
        onSuccess={() => {
          loadUser();
        }}
      />
    </>
  );
}
