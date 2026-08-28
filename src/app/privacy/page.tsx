import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mt-1">Last Updated: August 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            When you register on LELAM RANK or place a bid, we collect your email address, full name, and the public profile details of your entry (name, description, logo URL, website, and social links).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Public vs Anonymous Bidding</h2>
          <p>
            Bid amounts, entry names, and verified timestamps are publicly displayed on the leaderboard. If you select &quot;Anonymous Bidder&quot;, your personal name is masked from the public bid history.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Payment Information</h2>
          <p>
            Payments are securely processed via Razorpay. We do not store your credit card, debit card, or net banking credentials on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Contact & Inquiries</h2>
          <p>
            For privacy inquiries or data removal requests, please contact privacy@lelam-rank.vercel.app.
          </p>
        </section>
      </div>
    </div>
  );
}
