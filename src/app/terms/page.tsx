import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="text-xs text-slate-400 mt-1">Last Updated: August 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Platform Nature & Agreement</h2>
          <p>
            LELAM RANK provides a competitive visibility leaderboard. By placing a bid or registering an entry, you agree to these terms, platform rules, and deterministic ranking mechanics.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Bidding & Outbidding</h2>
          <p>
            Each bid placed constitutes an immediate, permanent payment for leaderboard positioning. Ranking is determined by verified bid amounts and timestamps. Being outbid by another participant does not entitle the user to a refund or return of funds.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Content Representation & Rights</h2>
          <p>
            You represent and warrant that you own or are authorized to promote the startup, brand, SaaS, or digital product listed in your entry. Impersonation, fraud, or copyright infringement will result in entry suspension.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. No Guaranteed Commercial Outcomes</h2>
          <p>
            LELAM RANK does not guarantee traffic, sales, investors, or commercial results. Visibility is strictly organic and based on community engagement and platform traffic.
          </p>
        </section>
      </div>
    </div>
  );
}
