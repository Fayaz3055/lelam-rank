import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, Scale, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

export default function RulesPage() {
  const rankingRules = [
    {
      title: '1. Minimum Bid: ₹50',
      desc: 'The minimum bid required to enter or outbid is ₹50. There is no artificial upper limit.',
    },
    {
      title: '2. Highest Verified Bid Wins',
      desc: 'Ranking is determined strictly by the highest verified payment amount. Unverified or pending payments have zero effect on ranks.',
    },
    {
      title: '3. Timestamp Tie-Breaker',
      desc: 'If two entities hold the exact same verified bid amount (e.g. ₹10,000), the entity with the earlier payment timestamp ranks higher.',
    },
    {
      title: '4. Non-Refundable Outbidding',
      desc: 'Bids are permanent payments. If another participant outbids you, your entry remains live at its newly calculated rank. Bids are not refunded for being outbid.',
    },
    {
      title: '5. Zero Manual Bid Tampering',
      desc: 'The platform administrators have no ability to manually inflate or edit bid amounts. The leaderboard integrity is enforced by database rules.',
    },
  ];

  const moderationProhibitions = [
    'Impersonating another brand, individual, startup, or company without authorization',
    'Fraudulent schemes, scams, or deceptive financial offerings',
    'Malicious links, phishing domains, or software containing malware',
    'Hate speech, harassment, abusive content, or illegal goods/services',
    'Creating dozens of duplicate or spam entries for the same entity',
    'Content violating applicable cyber laws and regulations',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-3">
          <Scale className="w-3.5 h-3.5" />
          <span>LEADERBOARD INTEGRITY</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          Platform Rules
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Clear, deterministic, and binding guidelines for all participants on LELAM RANK.
        </p>
      </div>

      {/* Ranking Rules */}
      <div className="rounded-3xl bg-[#0E1017] border border-white/[0.08] p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <ShieldCheck className="w-5 h-5 text-[#E5C158]" />
          <h2 className="text-xl font-bold text-white">Bidding & Ranking Rules</h2>
        </div>

        <div className="space-y-4">
          {rankingRules.map((rule, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#141720] border border-white/[0.05]">
              <h3 className="text-sm font-bold text-amber-300">{rule.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content Moderation Rules */}
      <div className="rounded-3xl bg-[#0E1017] border border-rose-500/20 p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h2 className="text-xl font-bold text-white">Prohibited Content & Moderation</h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300">
          The following actions will lead to immediate suspension or permanent removal of the offending entry:
        </p>

        <ul className="space-y-2.5 text-xs text-slate-300">
          {moderationProhibitions.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs text-rose-300/90 leading-relaxed">
          Entries removed for severe rule violations (e.g. fraud or impersonation) are evaluated in accordance with our{' '}
          <Link href="/refund-policy" className="underline font-semibold hover:text-white">
            Refund Policy
          </Link>
          .
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/create"
          className="gold-gradient-button text-black font-extrabold text-xs px-8 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-xl shadow-amber-500/15"
        >
          <span>Claim Your Spot (₹50 Min)</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
