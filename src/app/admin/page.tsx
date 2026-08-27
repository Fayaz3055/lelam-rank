'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Star,
  ExternalLink,
  Lock,
  LogOut,
} from 'lucide-react';
import { dbService } from '@/services/db';
import { Entry, Payment, ActivityEvent, LeaderboardStats } from '@/types';
import { formatINR, formatTimeAgo } from '@/lib/ranking';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'entries' | 'payments' | 'activity'>('overview');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    championBid: 0,
    championName: '',
    championSlug: '',
    totalEntries: 0,
    totalBidVolume: 0,
    totalVerifiedBids: 0,
  });
  const [checkingAuth, setCheckingAuth] = useState(true);

  const loadData = async () => {
    const [eList, aList, sData] = await Promise.all([
      dbService.getLeaderboardEntries(),
      dbService.getActivityFeed(),
      dbService.getStats(),
    ]);
    setEntries(eList);
    setActivities(aList);
    setStats(sData);
  };

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const res = await fetch('/api/admin/verify-session');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        setCheckingAuth(false);
        await loadData();
      } catch {
        router.push('/admin/login');
      }
    }

    checkAdminAuth();
  }, [router]);

  const handleToggleSuspend = async (entry: Entry) => {
    const nextStatus = entry.status === 'active' ? 'suspended' : 'active';
    await dbService.updateEntryStatus(entry.id, nextStatus);
    await loadData();
  };

  const handleToggleFeature = async (entry: Entry) => {
    await dbService.toggleFeatured(entry.id);
    await loadData();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-[#E5C158] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTHORITATIVE ADMIN CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Platform Moderation & Analytics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/leaderboard"
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold border border-white/[0.08] transition-colors"
          >
            View Live Site
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Integrity Assurance Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/90">
        <Lock className="w-4 h-4 text-[#E5C158] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Leaderboard Integrity Protected:</strong>
          Admin accounts can moderate entries (suspend, activate, feature) or edit metadata, but cannot manually edit bid amounts. All bids are strictly bound to verified payment records.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'overview'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('entries')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'entries'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Entries Moderation ({entries.length})
        </button>
        <button
          onClick={() => setTab('payments')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'payments'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Payment Audit Logs ({payments.length})
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'activity'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Activity Stream ({activities.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400">TOTAL ENTRIES</span>
              <div className="text-2xl font-black text-white mt-1">{stats.totalEntries}</div>
              <div className="text-[11px] text-emerald-400 mt-1">100% active pool</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400">TOTAL BID VOLUME</span>
              <div className="text-2xl font-black text-[#E5C158] mt-1">{formatINR(stats.totalBidVolume)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Verified gross volume</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400">REIGNING #1 BID</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{formatINR(stats.championBid)}</div>
              <div className="text-[11px] text-slate-400 truncate mt-1">{stats.championName}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400">PAYMENT STATUS</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">Ready</div>
              <div className="text-[11px] text-slate-400 mt-1">Razorpay Integration Active</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ENTRIES MODERATION */}
      {tab === 'entries' && (
        <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">All Competing Entities</span>
            <span className="text-amber-400">{entries.length} items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#141720] text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Entry</th>
                  <th className="p-4">Holding Bid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono font-bold text-amber-400">
                      #{entry.current_rank || 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#08090C] border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
                          {entry.logo_url ? (
                            <Image
                              src={entry.logo_url}
                              alt={entry.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-[10px] text-white">
                              {entry.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{entry.name}</span>
                            <Link href={`/${entry.slug}`} target="_blank" className="text-slate-400 hover:text-white">
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">/{entry.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {formatINR(entry.current_bid)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        entry.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleFeature(entry)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          entry.featured
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-white/[0.04] border-white/[0.08] text-slate-500'
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleSuspend(entry)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          entry.status === 'active'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {entry.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS AUDIT LOG */}
      {tab === 'payments' && (
        <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-8 text-center text-xs text-slate-400">
          Payment transactions are securely synchronized from verified Razorpay webhook records.
        </div>
      )}

      {/* TAB 4: ACTIVITY STREAM */}
      {tab === 'activity' && (
        <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.05] flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white">{act.entry_name}</span>{' '}
                <span className="text-slate-400">triggered</span>{' '}
                <span className="font-bold text-amber-400 uppercase">{act.event_type}</span>{' '}
                <span className="text-slate-400">and reached rank #{act.new_rank}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#E5C158] font-bold">{formatINR(act.amount)}</span>
                <span className="text-slate-500 text-[11px] font-mono">{formatTimeAgo(act.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
