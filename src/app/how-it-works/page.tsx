import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Trophy, Zap, ShieldCheck, Share2, Layers, HelpCircle } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Create Your Entry',
      description:
        'Submit your startup, business, SaaS, AI tool, or digital project name, one-line pitch, URL slug, and optional logo/social links.',
    },
    {
      num: '02',
      title: 'Place Your Verified Bid',
      description:
        'Enter any amount starting from ₹50. There is no artificial cap. Your bid amount represents the payment made to hold your position.',
    },
    {
      num: '03',
      title: 'Instant Payment Verification',
      description:
        'Payments are verified server-side through Razorpay. Only 100% verified payments can influence the leaderboard.',
    },
    {
      num: '04',
      title: 'Deterministic Rank Calculation',
      description:
        'The ranking engine positions your entry strictly by highest verified bid. If two bids are identical, the earlier verified timestamp ranks higher.',
    },
    {
      num: '05',
      title: 'Generate & Share Your Rank Card',
      description:
        'Download your branded rank badge (e.g., "🏆 #3 IN KERALA") and share on WhatsApp, X, LinkedIn, and Instagram to build momentum.',
    },
    {
      num: '06',
      title: 'Compete & Outbid',
      description:
        'If a competitor outbids you, your entry never disappears. It moves to its new rightful spot, and you can bid again anytime to reclaim the top.',
    },
  ];

  const faqs = [
    {
      q: 'What is the minimum bid to get listed?',
      a: 'The minimum bid is ₹50. There is no platform fee on top of your bid in V1.',
    },
    {
      q: 'What happens if someone outbids my entry?',
      a: 'Your entry remains active on the leaderboard and slides down to the next qualified position. You receive an outbid alert and can place a higher bid to jump back up.',
    },
    {
      q: 'Are bids refundable when outbid?',
      a: 'No. Bids represent visibility payments and are non-refundable simply because another participant outbids you. However, if an entry is removed for rule violations, refunds follow our published refund policy.',
    },
    {
      q: 'How are tied bids resolved?',
      a: 'If two entries have the exact same verified bid amount (e.g. ₹5,000), the earlier verified payment timestamp is awarded the higher rank.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>THE OUTBID MECHANIC</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          How It Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          LELAM RANK is built on simple, deterministic, and transparent competitive mechanics.
        </p>
      </div>

      {/* 6 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 sm:p-8 space-y-3 relative"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] font-mono font-bold flex items-center justify-center text-sm">
              {step.num}
            </div>
            <h3 className="text-lg font-bold text-white">{step.title}</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="rounded-3xl bg-[#0A0C11] border border-white/[0.08] p-8 sm:p-12 space-y-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#E5C158]" />
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200">{faq.q}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#12141D] to-[#0A0C10] border border-amber-500/30 p-8 text-center space-y-4">
        <h3 className="text-2xl font-bold text-white">Ready to Claim Your Rank?</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Create your profile and bid to secure visibility on Kerala&apos;s leading tech leaderboard.
        </p>
        <Link
          href="/create"
          className="gold-gradient-button text-black font-extrabold text-xs px-6 py-3 rounded-xl inline-flex items-center gap-2"
        >
          <span>Claim Your Spot (₹50 Min)</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
