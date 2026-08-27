import React from 'react';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-extrabold text-white">Refund Policy</h1>
        <p className="text-xs text-slate-400 mt-1">Last Updated: August 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Outbid Payments Are Non-Refundable</h2>
          <p>
            LELAM RANK is a competitive bidding leaderboard. When you place a verified bid, your payment is permanently committed to securing your spot. If another entity outbids you, your entry remains active on the board at its recalculated position. Refunds are not issued simply due to competition or being outbid.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Technical & Billing Errors</h2>
          <p>
            In the rare event of a duplicate charge or technical failure where funds are deducted without a corresponding bid being verified by the database, we will investigate and issue a full refund to the original payment method within 5–7 business days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Moderation Removal & Violations</h2>
          <p>
            If an entry is removed or suspended for violating platform rules (e.g. fraud, illegal activity, malware, or impersonation), refund eligibility is evaluated on a case-by-case basis by the moderation team.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Refund Support</h2>
          <p>
            For refund queries regarding billing anomalies, please email support@lelamrank.in with your transaction details and order ID.
          </p>
        </section>
      </div>
    </div>
  );
}
